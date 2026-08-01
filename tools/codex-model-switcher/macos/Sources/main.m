#import <AppKit/AppKit.h>

typedef NS_ENUM(NSInteger, ProviderMode) {
    ProviderModeGPT = 0,
    ProviderModeDeepSeek = 1,
};

static NSString *ConfigPath(void) {
    return [NSHomeDirectory() stringByAppendingPathComponent:@".codex/config.toml"];
}

static NSString *ModelsPath(void) {
    return [NSHomeDirectory() stringByAppendingPathComponent:@".codex/models.json"];
}

static NSString *ModeSlug(ProviderMode mode) {
    return mode == ProviderModeDeepSeek ? @"deepseek" : @"gpt";
}

static NSString *ModeShortLabel(ProviderMode mode) {
    return mode == ProviderModeDeepSeek ? @"DS" : @"GPT";
}

static NSString *ModeDisplayName(ProviderMode mode) {
    return mode == ProviderModeDeepSeek
        ? @"DeepSeek · V4 Flash"
        : @"OpenAI · GPT-5.6 Sol";
}

static ProviderMode CurrentProvider(NSError **error) {
    NSString *config = [NSString stringWithContentsOfFile:ConfigPath()
                                                  encoding:NSUTF8StringEncoding
                                                     error:error];
    if (config == nil) {
        return ProviderModeGPT;
    }

    for (NSString *rawLine in [config componentsSeparatedByCharactersInSet:
                                NSCharacterSet.newlineCharacterSet]) {
        NSString *line = [rawLine stringByTrimmingCharactersInSet:
                           NSCharacterSet.whitespaceCharacterSet];
        if ([line hasPrefix:@"["]) {
            break;
        }
        if ([line isEqualToString:@"model_provider = \"deepseek\""]) {
            return ProviderModeDeepSeek;
        }
    }
    return ProviderModeGPT;
}

static NSError *SwitcherError(NSString *message) {
    return [NSError errorWithDomain:@"com.tuaran.codex-provider-menu"
                               code:1
                           userInfo:@{NSLocalizedDescriptionKey: message}];
}

static BOOL RunSwitch(ProviderMode mode, NSError **error) {
    NSString *script = [NSBundle.mainBundle pathForResource:@"codex-provider-switch"
                                                     ofType:nil];
    if (script == nil) {
        if (error != NULL) {
            *error = SwitcherError(@"应用资源不完整，请重新构建或下载此工具。");
        }
        return NO;
    }

    NSTask *task = [[NSTask alloc] init];
    task.executableURL = [NSURL fileURLWithPath:@"/bin/sh"];
    task.arguments = @[script, ModeSlug(mode)];

    NSPipe *pipe = [NSPipe pipe];
    task.standardOutput = pipe;
    task.standardError = pipe;

    NSError *launchError = nil;
    if (![task launchAndReturnError:&launchError]) {
        if (error != NULL) {
            *error = launchError;
        }
        return NO;
    }

    [task waitUntilExit];
    NSData *data = [pipe.fileHandleForReading readDataToEndOfFile];
    NSString *output = [[NSString alloc] initWithData:data
                                             encoding:NSUTF8StringEncoding];
    output = [output stringByTrimmingCharactersInSet:
              NSCharacterSet.whitespaceAndNewlineCharacterSet];

    if (task.terminationStatus != 0) {
        if (error != NULL) {
            *error = SwitcherError(
                output.length > 0 ? output : @"切换失败，配置没有通过校验。"
            );
        }
        return NO;
    }
    return YES;
}

static void ShowAlert(NSString *title, NSString *message, NSAlertStyle style) {
    NSAlert *alert = [[NSAlert alloc] init];
    alert.alertStyle = style;
    alert.messageText = title;
    alert.informativeText = message;
    [alert addButtonWithTitle:@"好"];
    [alert runModal];
}

@interface AppDelegate : NSObject <NSApplicationDelegate>
@property(nonatomic, strong) NSStatusItem *statusItem;
@property(nonatomic, strong) NSMenu *providerMenu;
@property(nonatomic, strong) NSWindow *window;
@property(nonatomic, strong) NSTextField *currentProviderLabel;
@property(nonatomic, strong) NSTextField *providerDescriptionLabel;
@property(nonatomic, strong) NSButton *gptButton;
@property(nonatomic, strong) NSButton *deepSeekButton;
@property(nonatomic, assign) ProviderMode selectedMode;
@end

@implementation AppDelegate

- (void)applicationDidFinishLaunching:(NSNotification *)notification {
    (void)notification;

    // A menu-bar-only app has no regular windows, so AppKit may otherwise
    // classify it as idle and terminate it automatically shortly after launch.
    [NSProcessInfo.processInfo disableAutomaticTermination:
        @"Keep the Codex provider menu available in the menu bar"];

    pid_t ownPID = NSProcessInfo.processInfo.processIdentifier;
    for (NSRunningApplication *instance in
         [NSRunningApplication runningApplicationsWithBundleIdentifier:
          NSBundle.mainBundle.bundleIdentifier]) {
        if (instance.processIdentifier != ownPID && !instance.terminated) {
            [NSApp terminate:nil];
            return;
        }
    }

    [NSApp setActivationPolicy:NSApplicationActivationPolicyRegular];
    self.statusItem = [NSStatusBar.systemStatusBar
        statusItemWithLength:NSVariableStatusItemLength];
    self.statusItem.button.target = self;
    self.statusItem.button.action = @selector(showProviderMenu:);
    [self.statusItem.button sendActionOn:
        NSEventMaskLeftMouseUp | NSEventMaskRightMouseUp];
    [self buildWindow];
    [self refreshMenu];
    [self showMainWindow:nil];
}

- (void)buildWindow {
    NSRect frame = NSMakeRect(0, 0, 520, 340);
    self.window = [[NSWindow alloc]
        initWithContentRect:frame
        styleMask:NSWindowStyleMaskTitled |
                  NSWindowStyleMaskClosable |
                  NSWindowStyleMaskMiniaturizable
        backing:NSBackingStoreBuffered
        defer:NO];
    self.window.title = @"Codex 模型切换器";
    self.window.releasedWhenClosed = NO;
    [self.window center];

    NSView *content = self.window.contentView;

    NSTextField *title = [NSTextField labelWithString:@"选择 Codex 默认模型"];
    title.frame = NSMakeRect(28, 276, 464, 34);
    title.font = [NSFont systemFontOfSize:24 weight:NSFontWeightSemibold];
    [content addSubview:title];

    self.currentProviderLabel = [NSTextField labelWithString:@"正在读取当前配置…"];
    self.currentProviderLabel.frame = NSMakeRect(28, 238, 464, 26);
    self.currentProviderLabel.font = [NSFont systemFontOfSize:16 weight:NSFontWeightMedium];
    [content addSubview:self.currentProviderLabel];

    self.providerDescriptionLabel = [NSTextField labelWithString:
        @"切换后会验证配置，并退出和重新打开 Codex。"];
    self.providerDescriptionLabel.frame = NSMakeRect(28, 208, 464, 22);
    self.providerDescriptionLabel.textColor = NSColor.secondaryLabelColor;
    self.providerDescriptionLabel.font = [NSFont systemFontOfSize:13];
    [content addSubview:self.providerDescriptionLabel];

    self.gptButton = [NSButton buttonWithTitle:@"使用 GPT"
                                        target:self
                                        action:@selector(selectGPT:)];
    self.gptButton.frame = NSMakeRect(28, 136, 220, 52);
    self.gptButton.bezelStyle = NSBezelStyleRounded;
    self.gptButton.font = [NSFont systemFontOfSize:15 weight:NSFontWeightMedium];
    [content addSubview:self.gptButton];

    self.deepSeekButton = [NSButton buttonWithTitle:@"使用 DeepSeek"
                                             target:self
                                             action:@selector(selectDeepSeek:)];
    self.deepSeekButton.frame = NSMakeRect(272, 136, 220, 52);
    self.deepSeekButton.bezelStyle = NSBezelStyleRounded;
    self.deepSeekButton.font = [NSFont systemFontOfSize:15 weight:NSFontWeightMedium];
    [content addSubview:self.deepSeekButton];

    NSButton *refresh = [NSButton buttonWithTitle:@"重新读取状态"
                                           target:self
                                           action:@selector(refreshStatus:)];
    refresh.frame = NSMakeRect(28, 82, 150, 34);
    refresh.bezelStyle = NSBezelStyleRounded;
    [content addSubview:refresh];

    NSButton *openFolder = [NSButton buttonWithTitle:@"打开配置文件夹"
                                              target:self
                                              action:@selector(openConfigFolder:)];
    openFolder.frame = NSMakeRect(190, 82, 150, 34);
    openFolder.bezelStyle = NSBezelStyleRounded;
    [content addSubview:openFolder];

    NSTextField *warning = [NSTextField labelWithString:
        @"请先等待正在运行的 Codex 任务结束，再执行切换。"];
    warning.frame = NSMakeRect(28, 34, 464, 24);
    warning.textColor = NSColor.secondaryLabelColor;
    warning.font = [NSFont systemFontOfSize:12];
    [content addSubview:warning];
}

- (void)showMainWindow:(id)sender {
    (void)sender;
    [self refreshMenu];
    [self.window makeKeyAndOrderFront:nil];
    [NSApp activateIgnoringOtherApps:YES];
}

- (BOOL)applicationShouldHandleReopen:(NSApplication *)sender
                    hasVisibleWindows:(BOOL)flag {
    (void)sender;
    if (!flag) {
        [self showMainWindow:nil];
    }
    return YES;
}

- (BOOL)applicationShouldTerminateAfterLastWindowClosed:(NSApplication *)sender {
    (void)sender;
    return NO;
}

- (void)showProviderMenu:(id)sender {
    (void)sender;
    [self refreshMenu];
    [self.statusItem popUpStatusItemMenu:self.providerMenu];
}

- (void)refreshMenu {
    NSError *error = nil;
    self.selectedMode = CurrentProvider(&error);

    if (error == nil) {
        self.statusItem.button.title = ModeShortLabel(self.selectedMode);
        self.statusItem.button.toolTip = [NSString stringWithFormat:
            @"Codex Provider：%@", ModeDisplayName(self.selectedMode)];
        self.currentProviderLabel.stringValue = [NSString stringWithFormat:
            @"当前：%@", ModeDisplayName(self.selectedMode)];
        self.providerDescriptionLabel.stringValue =
            @"切换后会验证配置，并退出和重新打开 Codex。";
        self.gptButton.title = self.selectedMode == ProviderModeGPT
            ? @"✓ 正在使用 GPT" : @"使用 GPT";
        self.deepSeekButton.title = self.selectedMode == ProviderModeDeepSeek
            ? @"✓ 正在使用 DeepSeek" : @"使用 DeepSeek";
    } else {
        self.statusItem.button.title = @"?";
        self.statusItem.button.toolTip = @"Codex Provider 配置不可用";
        self.currentProviderLabel.stringValue = @"当前配置不可用";
        self.providerDescriptionLabel.stringValue = error.localizedDescription;
    }

    NSMenu *menu = [[NSMenu alloc] initWithTitle:@"Codex 模型切换器"];

    NSMenuItem *showWindow = [[NSMenuItem alloc]
        initWithTitle:@"显示模型切换器"
        action:@selector(showMainWindow:)
        keyEquivalent:@""];
    showWindow.target = self;
    [menu addItem:showWindow];
    [menu addItem:NSMenuItem.separatorItem];

    NSMenuItem *current = [[NSMenuItem alloc]
        initWithTitle:[NSString stringWithFormat:
            @"当前：%@", ModeDisplayName(self.selectedMode)]
        action:nil
        keyEquivalent:@""];
    current.enabled = NO;
    [menu addItem:current];
    [menu addItem:NSMenuItem.separatorItem];

    NSMenuItem *gpt = [[NSMenuItem alloc]
        initWithTitle:@"使用 GPT"
        action:@selector(selectGPT:)
        keyEquivalent:@""];
    gpt.target = self;
    gpt.state = self.selectedMode == ProviderModeGPT
        ? NSControlStateValueOn : NSControlStateValueOff;
    [menu addItem:gpt];

    NSMenuItem *deepSeek = [[NSMenuItem alloc]
        initWithTitle:@"使用 DeepSeek"
        action:@selector(selectDeepSeek:)
        keyEquivalent:@""];
    deepSeek.target = self;
    deepSeek.state = self.selectedMode == ProviderModeDeepSeek
        ? NSControlStateValueOn : NSControlStateValueOff;
    [menu addItem:deepSeek];

    [menu addItem:NSMenuItem.separatorItem];

    NSMenuItem *refresh = [[NSMenuItem alloc]
        initWithTitle:@"重新读取状态"
        action:@selector(refreshStatus:)
        keyEquivalent:@"r"];
    refresh.target = self;
    [menu addItem:refresh];

    NSMenuItem *openFolder = [[NSMenuItem alloc]
        initWithTitle:@"打开 Codex 配置文件夹"
        action:@selector(openConfigFolder:)
        keyEquivalent:@""];
    openFolder.target = self;
    [menu addItem:openFolder];

    [menu addItem:NSMenuItem.separatorItem];

    NSMenuItem *quit = [[NSMenuItem alloc]
        initWithTitle:@"退出模型切换器"
        action:@selector(quitSwitcher:)
        keyEquivalent:@"q"];
    quit.target = self;
    [menu addItem:quit];

    self.providerMenu = menu;
}

- (void)selectGPT:(id)sender {
    (void)sender;
    [self requestSwitch:ProviderModeGPT];
}

- (void)selectDeepSeek:(id)sender {
    (void)sender;
    [self requestSwitch:ProviderModeDeepSeek];
}

- (void)refreshStatus:(id)sender {
    (void)sender;
    [self refreshMenu];
}

- (void)openConfigFolder:(id)sender {
    (void)sender;
    NSString *path = [NSHomeDirectory() stringByAppendingPathComponent:@".codex"];
    [NSWorkspace.sharedWorkspace openURL:[NSURL fileURLWithPath:path]];
}

- (void)quitSwitcher:(id)sender {
    (void)sender;
    [NSApp terminate:nil];
}

- (void)requestSwitch:(ProviderMode)mode {
    [NSApp activateIgnoringOtherApps:YES];

    if (mode == self.selectedMode) {
        ShowAlert(
            [NSString stringWithFormat:@"已经在使用 %@", ModeShortLabel(mode)],
            [NSString stringWithFormat:@"当前 Provider 是 %@。", ModeDisplayName(mode)],
            NSAlertStyleInformational
        );
        return;
    }

    NSAlert *alert = [[NSAlert alloc] init];
    alert.alertStyle = NSAlertStyleWarning;
    alert.messageText = [NSString stringWithFormat:
        @"切换到 %@？", ModeDisplayName(mode)];
    alert.informativeText =
        @"切换会退出并重新打开 Codex。正在运行的任务可能会中断，请先保存或等待任务完成。";
    [alert addButtonWithTitle:@"切换并重启"];
    [alert addButtonWithTitle:@"取消"];

    if ([alert runModal] != NSAlertFirstButtonReturn) {
        return;
    }

    NSError *error = nil;
    if (!RunSwitch(mode, &error)) {
        ShowAlert(@"切换失败", error.localizedDescription, NSAlertStyleCritical);
        [self refreshMenu];
        return;
    }

    self.selectedMode = mode;
    [self refreshMenu];
    [self restartCodex];
}

- (void)restartCodex {
    NSString *bundleID = @"com.openai.codex";
    for (NSRunningApplication *app in
         [NSRunningApplication runningApplicationsWithBundleIdentifier:bundleID]) {
        [app terminate];
    }
    [self waitForCodexExitAndOpen:12];
}

- (void)waitForCodexExitAndOpen:(NSInteger)attempts {
    NSString *bundleID = @"com.openai.codex";
    BOOL stillRunning =
        [NSRunningApplication runningApplicationsWithBundleIdentifier:bundleID].count > 0;

    if (stillRunning && attempts > 0) {
        dispatch_after(
            dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.5 * NSEC_PER_SEC)),
            dispatch_get_main_queue(),
            ^{
                [self waitForCodexExitAndOpen:attempts - 1];
            }
        );
        return;
    }

    if (stillRunning) {
        ShowAlert(
            @"配置已切换",
            @"Codex 没有在等待时间内退出，请手动完全退出并重新打开。",
            NSAlertStyleWarning
        );
        return;
    }

    NSURL *appURL = [NSURL fileURLWithPath:@"/Applications/ChatGPT.app"];
    NSWorkspaceOpenConfiguration *configuration =
        [NSWorkspaceOpenConfiguration configuration];
    configuration.activates = YES;
    [NSWorkspace.sharedWorkspace
        openApplicationAtURL:appURL
        configuration:configuration
        completionHandler:^(NSRunningApplication *application, NSError *error) {
            (void)application;
            if (error != nil) {
                ShowAlert(
                    @"配置已切换",
                    [NSString stringWithFormat:
                        @"无法自动打开 Codex：%@。请手动打开。",
                        error.localizedDescription],
                    NSAlertStyleWarning
                );
            }
        }];
}

@end

static int RunSelfTest(void) {
    NSString *script = [NSBundle.mainBundle pathForResource:@"codex-provider-switch"
                                                     ofType:nil];
    if (script == nil) {
        fprintf(stderr, "self_test=failed: switch resource missing\n");
        return 1;
    }

    NSError *error = nil;
    ProviderMode mode = CurrentProvider(&error);
    if (error != nil) {
        fprintf(stderr, "self_test=failed: config unavailable\n");
        return 1;
    }

    printf("self_test=ok\n");
    printf("current_provider=%s\n", ModeSlug(mode).UTF8String);
    printf("switch_resource=ok\n");
    return 0;
}

int main(int argc, const char *argv[]) {
    @autoreleasepool {
        for (int i = 1; i < argc; i++) {
            if (strcmp(argv[i], "--self-test") == 0) {
                return RunSelfTest();
            }
        }

        NSApplication *app = NSApplication.sharedApplication;
        AppDelegate *delegate = [[AppDelegate alloc] init];
        app.delegate = delegate;
        [app run];
    }
    return 0;
}
