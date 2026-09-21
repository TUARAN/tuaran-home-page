#import <AppKit/AppKit.h>

static void ExportKeyToLaunchd(NSData *data) {
    if (data.length == 0) return;
    NSTask *task = [[NSTask alloc] init];
    task.executableURL = [NSURL fileURLWithPath:@"/bin/sh"];
    task.arguments = @[@"-c", @"IFS= read -r value; /bin/launchctl setenv DEEPSEEK_API_KEY \"$value\""];
    NSPipe *input = [NSPipe pipe];
    task.standardInput = input;
    if ([task launchAndReturnError:NULL]) {
        [input.fileHandleForWriting writeData:data];
        [input.fileHandleForWriting writeData:[@"\n" dataUsingEncoding:NSUTF8StringEncoding]];
        [input.fileHandleForWriting closeFile];
        [task waitUntilExit];
    }
}

typedef NS_ENUM(NSInteger, ProviderMode) {
    ProviderModeGPT = 0,
    ProviderModeHybrid = 1,
    ProviderModeDeepSeek = 2,
};

static NSString *ConfigPath(void) {
    return [NSHomeDirectory() stringByAppendingPathComponent:@".codex/config.toml"];
}

static NSString *ModelsPath(void) {
    return [NSHomeDirectory() stringByAppendingPathComponent:@".codex/models.json"];
}

static NSString *ModeSlug(ProviderMode mode) {
    switch (mode) {
        case ProviderModeHybrid: return @"hybrid";
        case ProviderModeDeepSeek: return @"deepseek";
        case ProviderModeGPT: return @"gpt";
    }
    return @"gpt";
}

static NSString *ModeShortLabel(ProviderMode mode) {
    switch (mode) {
        case ProviderModeHybrid: return @"GPT+DS";
        case ProviderModeDeepSeek: return @"DS";
        case ProviderModeGPT: return @"GPT";
    }
    return @"GPT";
}

static NSString *ModeDisplayName(ProviderMode mode) {
    switch (mode) {
        case ProviderModeHybrid: return @"GPT-5.6 · DeepSeek Subagent";
        case ProviderModeDeepSeek: return @"DeepSeek · Chat";
        case ProviderModeGPT: return @"OpenAI · GPT-5.6 Sol";
    }
    return @"OpenAI · GPT-5.6 Sol";
}

static NSColor *ColorFromHex(int hex) {
    return [NSColor colorWithSRGBRed:((hex >> 16) & 0xFF) / 255.0
                               green:((hex >> 8) & 0xFF) / 255.0
                                blue:(hex & 0xFF) / 255.0
                               alpha:1.0];
}

static NSColor *ModeColor(ProviderMode mode) {
    switch (mode) {
        case ProviderModeHybrid: return ColorFromHex(0x7B2CBF);
        case ProviderModeDeepSeek: return ColorFromHex(0x2E6BFF);
        case ProviderModeGPT: return ColorFromHex(0xFF2E97);
    }
    return ColorFromHex(0x2D2A4A);
}

static NSString *ModeEmoji(ProviderMode mode) {
    switch (mode) {
        case ProviderModeHybrid: return @"⚡";
        case ProviderModeDeepSeek: return @"🦄";
        case ProviderModeGPT: return @"🤖";
    }
    return @"✨";
}

static NSString *MarkerPath(void) {
    return [NSHomeDirectory() stringByAppendingPathComponent:@".codex/provider-mode"];
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
    NSString *marker = [NSString stringWithContentsOfFile:MarkerPath()
                                                  encoding:NSUTF8StringEncoding
                                                     error:NULL];
    if ([[marker stringByTrimmingCharactersInSet:
           NSCharacterSet.whitespaceAndNewlineCharacterSet]
         isEqualToString:@"hybrid"]) {
        return ProviderModeHybrid;
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

@interface GradientBackgroundView : NSView
@end

@implementation GradientBackgroundView

- (void)drawRect:(NSRect)dirtyRect {
    NSGradient *gradient = [[NSGradient alloc] initWithColorsAndLocations:
        ColorFromHex(0xFFD9EE), 0.0,
        ColorFromHex(0xD9D1FF), 0.5,
        ColorFromHex(0xB8F2FF), 1.0,
        nil];
    [gradient drawInRect:self.bounds angle:115.0];

    NSArray *spots = @[
        @[@0.88, @0.18, @110.0],
        @[@0.08, @0.82, @130.0],
        @[@0.58, @0.96, @85.0],
        @[@0.24, @0.10, @60.0],
        @[@0.45, @0.28, @34.0],
    ];
    for (NSArray *spot in spots) {
        CGFloat cx = [spot[0] doubleValue] * NSWidth(self.bounds);
        CGFloat cy = [spot[1] doubleValue] * NSHeight(self.bounds);
        CGFloat radius = [spot[2] doubleValue];
        [[NSColor colorWithWhite:1.0 alpha:0.32] setFill];
        NSBezierPath *circle =
            [NSBezierPath bezierPathWithOvalInRect:
                NSMakeRect(cx - radius, cy - radius, radius * 2, radius * 2)];
        [circle fill];
    }
}

@end

@interface SectionPanelView : NSView
@end

@implementation SectionPanelView

- (void)drawRect:(NSRect)dirtyRect {
    (void)dirtyRect;
    NSRect cardRect = NSInsetRect(self.bounds, 1.0, 1.0);
    NSBezierPath *card = [NSBezierPath bezierPathWithRoundedRect:cardRect
                                                        xRadius:22.0
                                                        yRadius:22.0];

    [NSGraphicsContext saveGraphicsState];
    NSShadow *shadow = [[NSShadow alloc] init];
    shadow.shadowColor = [NSColor colorWithWhite:0.16 alpha:0.10];
    shadow.shadowBlurRadius = 14.0;
    shadow.shadowOffset = NSMakeSize(0, -3);
    [shadow set];
    [[NSColor colorWithWhite:1.0 alpha:0.52] setFill];
    [card fill];
    [NSGraphicsContext restoreGraphicsState];

    [[NSColor colorWithWhite:1.0 alpha:0.88] setStroke];
    card.lineWidth = 1.4;
    [card stroke];
}

@end

@interface DopamineButton : NSButton
@property(nonatomic, strong) NSColor *startColor;
@property(nonatomic, strong) NSColor *endColor;
@property(nonatomic, strong) NSColor *textColor;
@end

@implementation DopamineButton

- (instancetype)initWithFrame:(NSRect)frame {
    self = [super initWithFrame:frame];
    if (self) {
        self.bordered = NO;
        self.bezelStyle = NSBezelStyleRegularSquare;
        self.focusRingType = NSFocusRingTypeNone;
        self.font = [NSFont systemFontOfSize:15 weight:NSFontWeightHeavy];
        self.textColor = [NSColor whiteColor];
    }
    return self;
}

- (void)setTitle:(NSString *)title {
    [super setTitle:title];
    [self updateAttributedTitle];
}

- (void)setTextColor:(NSColor *)textColor {
    _textColor = textColor;
    [self updateAttributedTitle];
}

- (void)updateAttributedTitle {
    NSShadow *shadow = [[NSShadow alloc] init];
    shadow.shadowColor = [NSColor colorWithWhite:0.0 alpha:0.22];
    shadow.shadowOffset = NSMakeSize(0, -1);
    shadow.shadowBlurRadius = 1.5;
    NSDictionary *attributes = @{
        NSForegroundColorAttributeName: self.textColor,
        NSFontAttributeName: [NSFont systemFontOfSize:15 weight:NSFontWeightHeavy],
        NSShadowAttributeName: shadow,
    };
    self.attributedTitle =
        [[NSAttributedString alloc] initWithString:self.title attributes:attributes];
}

- (void)drawRect:(NSRect)dirtyRect {
    NSBezierPath *path =
        [NSBezierPath bezierPathWithRoundedRect:self.bounds
                                        xRadius:16.0
                                        yRadius:16.0];
    NSGradient *gradient;
    if (self.isHighlighted) {
        NSColor *darkStart =
            [self.startColor blendedColorWithFraction:0.22 ofColor:[NSColor blackColor]];
        NSColor *darkEnd =
            [self.endColor blendedColorWithFraction:0.22 ofColor:[NSColor blackColor]];
        gradient = [[NSGradient alloc] initWithStartingColor:darkStart
                                                  endingColor:darkEnd];
    } else {
        gradient = [[NSGradient alloc] initWithStartingColor:self.startColor
                                                  endingColor:self.endColor];
    }
    [gradient drawInBezierPath:path angle:45.0];
    [[NSColor colorWithWhite:1.0 alpha:0.75] setStroke];
    path.lineWidth = 1.5;
    [path stroke];
    [super drawRect:dirtyRect];
}

@end

static NSString *FormatTokenCount(unsigned long long value) {
    if (value >= 1000000000ULL) {
        return [NSString stringWithFormat:@"%.3fB", value / 1000000000.0];
    }
    if (value >= 1000000ULL) {
        return [NSString stringWithFormat:@"%.1fM", value / 1000000.0];
    }
    if (value >= 1000ULL) {
        return [NSString stringWithFormat:@"%.1fK", value / 1000.0];
    }
    return [NSString stringWithFormat:@"%llu", value];
}

static NSString *UsageTargetPath(void) {
    return [NSHomeDirectory() stringByAppendingPathComponent:
        @".codex/local-usage-target.json"];
}

static NSString *VibeUsageConfigPath(void) {
    return [NSHomeDirectory() stringByAppendingPathComponent:
        @".vibe-usage/config.json"];
}

static NSString *FindNPXExecutable(void) {
    NSArray<NSString *> *candidates = @[
        [NSHomeDirectory() stringByAppendingPathComponent:@".local/bin/npx"],
        @"/opt/homebrew/bin/npx",
        @"/usr/local/bin/npx",
        @"/usr/bin/npx",
    ];
    for (NSString *path in candidates) {
        if ([NSFileManager.defaultManager isExecutableFileAtPath:path]) return path;
    }
    return nil;
}

static NSString *SanitizedVibeOutput(NSData *data) {
    NSString *output = [[NSString alloc] initWithData:data
                                             encoding:NSUTF8StringEncoding] ?: @"";
    NSRegularExpression *keys = [NSRegularExpression
        regularExpressionWithPattern:@"vbu_[A-Za-z0-9_-]+"
                              options:0 error:NULL];
    output = [keys stringByReplacingMatchesInString:output options:0
                                              range:NSMakeRange(0, output.length)
                                       withTemplate:@"vbu_***"];
    output = [output stringByTrimmingCharactersInSet:
        NSCharacterSet.whitespaceAndNewlineCharacterSet];
    if (output.length > 1200) {
        output = [output substringFromIndex:output.length - 1200];
    }
    return output;
}

static const unsigned long long ReasonableUsageMinimum = 4500000000ULL;
static const unsigned long long ReasonableUsageMaximum = 5500000000ULL;

static NSString *LocalDateString(NSDate *date) {
    NSDateFormatter *formatter = [[NSDateFormatter alloc] init];
    formatter.locale = [NSLocale localeWithLocaleIdentifier:@"en_US_POSIX"];
    formatter.calendar = [[NSCalendar alloc] initWithCalendarIdentifier:NSCalendarIdentifierGregorian];
    formatter.timeZone = NSTimeZone.localTimeZone;
    formatter.dateFormat = @"yyyy-MM-dd";
    return [formatter stringFromDate:date];
}

static unsigned long long NonNegativeTokenValue(NSDictionary *value, NSString *key) {
    id raw = value[key];
    if (![raw isKindOfClass:NSNumber.class]) return 0;
    long long number = [raw longLongValue];
    return number > 0 ? (unsigned long long)number : 0;
}

static unsigned long long UsageInRollout(NSString *path) {
    NSError *readError = nil;
    NSData *data = [NSData dataWithContentsOfFile:path
                                         options:NSDataReadingMappedIfSafe
                                           error:&readError];
    if (data == nil || readError != nil) return 0;
    NSString *contents = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
    if (contents == nil) return 0;

    __block BOOL hasPrevious = NO;
    __block unsigned long long previousInput = 0;
    __block unsigned long long previousOutput = 0;
    __block unsigned long long total = 0;
    [contents enumerateLinesUsingBlock:^(NSString *line, BOOL *stop) {
        (void)stop;
        NSData *lineData = [line dataUsingEncoding:NSUTF8StringEncoding];
        NSDictionary *event = [NSJSONSerialization JSONObjectWithData:lineData
                                                               options:0
                                                                 error:NULL];
        if (![event isKindOfClass:NSDictionary.class] ||
            ![event[@"type"] isEqualToString:@"event_msg"]) return;
        NSDictionary *payload = event[@"payload"];
        if (![payload isKindOfClass:NSDictionary.class] ||
            ![payload[@"type"] isEqualToString:@"token_count"]) return;
        NSDictionary *info = payload[@"info"];
        if (![info isKindOfClass:NSDictionary.class]) return;
        NSDictionary *cumulative = info[@"total_token_usage"];
        if ([cumulative isKindOfClass:NSDictionary.class]) {
            unsigned long long input = NonNegativeTokenValue(cumulative, @"input_tokens");
            unsigned long long output = NonNegativeTokenValue(cumulative, @"output_tokens");
            if (!hasPrevious) {
                total += input + output;
            } else {
                total += input >= previousInput ? input - previousInput : input;
                total += output >= previousOutput ? output - previousOutput : output;
            }
            previousInput = input;
            previousOutput = output;
            hasPrevious = YES;
            return;
        }
        NSDictionary *incremental = info[@"last_token_usage"];
        if ([incremental isKindOfClass:NSDictionary.class]) {
            total += NonNegativeTokenValue(incremental, @"input_tokens");
            total += NonNegativeTokenValue(incremental, @"output_tokens");
        }
    }];
    return total;
}

static NSDictionary *ReadLocalUsageSummary(NSError **error) {
    NSString *today = LocalDateString(NSDate.date);
    NSArray<NSString *> *parts = [today componentsSeparatedByString:@"-"];
    NSString *dayDirectory = [NSHomeDirectory() stringByAppendingPathComponent:
        [NSString stringWithFormat:@".codex/sessions/%@/%@/%@", parts[0], parts[1], parts[2]]];
    NSArray<NSString *> *files = [NSFileManager.defaultManager
        contentsOfDirectoryAtPath:dayDirectory error:NULL] ?: @[];
    unsigned long long real = 0;
    NSUInteger scanned = 0;
    for (NSString *name in files) {
        if (![name.pathExtension.lowercaseString isEqualToString:@"jsonl"]) continue;
        scanned++;
        real += UsageInRollout([dayDirectory stringByAppendingPathComponent:name]);
    }

    unsigned long long observed = real;
    BOOL calibrationEnabled = NO;
    unsigned long long target = 0;
    NSData *targetData = [NSData dataWithContentsOfFile:UsageTargetPath()];
    if (targetData != nil) {
        NSDictionary *stored = [NSJSONSerialization JSONObjectWithData:targetData options:0 error:NULL];
        if ([stored isKindOfClass:NSDictionary.class] &&
            [stored[@"date"] isEqualToString:today] &&
            [stored[@"target_tokens"] isKindOfClass:NSNumber.class]) {
            calibrationEnabled = YES;
            target = [stored[@"target_tokens"] unsignedLongLongValue];
        }
    }
    unsigned long long adjustment = calibrationEnabled && target > observed
        ? target - observed : 0;
    unsigned long long total = observed + adjustment;
    (void)error;
    return @{
        @"date": today,
        @"real_tokens": @(real),
        @"observed_tokens": @(observed),
        @"adjustment_tokens": @(adjustment),
        @"target_tokens": calibrationEnabled ? @(target) : [NSNull null],
        @"total_tokens": @(total),
        @"calibration_enabled": @(calibrationEnabled),
        @"target_reached": @(!calibrationEnabled || observed <= target),
        @"files_scanned": @(scanned),
    };
}

static NSNumber *ParseUsageTarget(NSString *text, NSError **error) {
    NSString *trimmed = [[text stringByTrimmingCharactersInSet:
        NSCharacterSet.whitespaceAndNewlineCharacterSet] uppercaseString];
    NSRegularExpression *pattern = [NSRegularExpression
        regularExpressionWithPattern:@"^([0-9]+(?:\\.[0-9]+)?)\\s*([KMB]?)$"
                              options:0 error:NULL];
    NSTextCheckingResult *match = [pattern firstMatchInString:trimmed
                                                      options:0
                                                        range:NSMakeRange(0, trimmed.length)];
    if (match == nil) {
        if (error != NULL) *error = SwitcherError(@"请输入类似 10B、500M 或 1000000 的数值");
        return nil;
    }
    NSString *numberText = [trimmed substringWithRange:[match rangeAtIndex:1]];
    NSString *unit = [trimmed substringWithRange:[match rangeAtIndex:2]];
    NSDecimalNumber *number = [NSDecimalNumber decimalNumberWithString:numberText];
    NSDictionary *multipliers = @{
        @"": [NSDecimalNumber one], @"K": [NSDecimalNumber decimalNumberWithMantissa:1000 exponent:0 isNegative:NO],
        @"M": [NSDecimalNumber decimalNumberWithMantissa:1000000 exponent:0 isNegative:NO],
        @"B": [NSDecimalNumber decimalNumberWithMantissa:1000000000 exponent:0 isNegative:NO],
    };
    NSDecimalNumber *tokens = [number decimalNumberByMultiplyingBy:multipliers[unit]];
    NSDecimalNumberHandler *rounding = [NSDecimalNumberHandler
        decimalNumberHandlerWithRoundingMode:NSRoundPlain scale:0
        raiseOnExactness:NO raiseOnOverflow:NO raiseOnUnderflow:NO raiseOnDivideByZero:NO];
    NSDecimalNumber *integer = [tokens decimalNumberByRoundingAccordingToBehavior:rounding];
    if (![tokens isEqualToNumber:integer] || [tokens compare:[NSDecimalNumber zero]] == NSOrderedAscending ||
        [tokens compare:[NSDecimalNumber decimalNumberWithString:@"1000000000000"]] == NSOrderedDescending) {
        if (error != NULL) *error = SwitcherError(@"目标必须是 0 到 1T 之间的整数 Token 数");
        return nil;
    }
    return @([integer unsignedLongLongValue]);
}

static BOOL SaveUsageTargetNumber(NSNumber *tokens, NSError **error) {
    NSDictionary *payload = @{
        @"date": LocalDateString(NSDate.date),
        @"target_tokens": tokens,
        @"local_only": @YES,
    };
    NSData *data = [NSJSONSerialization dataWithJSONObject:payload
                                                   options:NSJSONWritingPrettyPrinted
                                                     error:error];
    if (data == nil) return NO;
    NSString *folder = UsageTargetPath().stringByDeletingLastPathComponent;
    if (![NSFileManager.defaultManager createDirectoryAtPath:folder
                                 withIntermediateDirectories:YES
                                                  attributes:nil error:error]) return NO;
    return [data writeToFile:UsageTargetPath() options:NSDataWritingAtomic error:error];
}

static BOOL SaveUsageTarget(NSString *text, NSError **error) {
    NSNumber *tokens = ParseUsageTarget(text, error);
    return tokens != nil && SaveUsageTargetNumber(tokens, error);
}

static NSNumber *RandomReasonableUsageTarget(void) {
    uint32_t span = (uint32_t)(ReasonableUsageMaximum - ReasonableUsageMinimum + 1);
    return @(ReasonableUsageMinimum + arc4random_uniform(span));
}

static BOOL ClearUsageTarget(NSError **error) {
    if (![NSFileManager.defaultManager fileExistsAtPath:UsageTargetPath()]) return YES;
    return [NSFileManager.defaultManager removeItemAtPath:UsageTargetPath() error:error];
}

@interface UsageChartView : NSView
@property(nonatomic, assign) unsigned long long realTokens;
@property(nonatomic, assign) unsigned long long observedTokens;
@property(nonatomic, assign) unsigned long long adjustmentTokens;
@property(nonatomic, assign) unsigned long long totalTokens;
@property(nonatomic, assign) unsigned long long targetTokens;
@property(nonatomic, assign) BOOL calibrationEnabled;
@property(nonatomic, assign) BOOL targetReached;
@property(nonatomic, copy) NSString *dateLabel;
@property(nonatomic, copy) NSString *errorMessage;
@property(nonatomic, assign) BOOL loading;
- (void)showLoading;
- (void)updateWithSummary:(NSDictionary *)summary;
- (void)showError:(NSString *)message;
@end

@implementation UsageChartView

- (BOOL)isFlipped {
    return YES;
}

- (void)showLoading {
    self.loading = YES;
    self.errorMessage = nil;
    [self setNeedsDisplay:YES];
}

- (void)updateWithSummary:(NSDictionary *)summary {
    self.loading = NO;
    self.errorMessage = nil;
    self.realTokens = [summary[@"real_tokens"] unsignedLongLongValue];
    self.observedTokens = [summary[@"observed_tokens"] unsignedLongLongValue];
    self.adjustmentTokens = [summary[@"adjustment_tokens"] unsignedLongLongValue];
    self.totalTokens = [summary[@"total_tokens"] unsignedLongLongValue];
    self.targetTokens = [summary[@"target_tokens"] isKindOfClass:NSNumber.class]
        ? [summary[@"target_tokens"] unsignedLongLongValue] : 0;
    self.calibrationEnabled = [summary[@"calibration_enabled"] boolValue];
    self.targetReached = [summary[@"target_reached"] boolValue];
    self.dateLabel = summary[@"date"] ?: @"今天";
    [self setNeedsDisplay:YES];
}

- (void)showError:(NSString *)message {
    self.loading = NO;
    self.errorMessage = message.length > 0 ? message : @"无法读取本地用量";
    [self setNeedsDisplay:YES];
}

- (void)drawRect:(NSRect)dirtyRect {
    (void)dirtyRect;
    NSBezierPath *card = [NSBezierPath bezierPathWithRoundedRect:self.bounds
                                                        xRadius:18.0
                                                        yRadius:18.0];
    [[NSColor colorWithWhite:1.0 alpha:0.64] setFill];
    [card fill];
    [[NSColor colorWithWhite:1.0 alpha:0.88] setStroke];
    card.lineWidth = 1.3;
    [card stroke];

    NSDictionary *titleAttributes = @{
        NSFontAttributeName: [NSFont systemFontOfSize:13 weight:NSFontWeightSemibold],
        NSForegroundColorAttributeName: ColorFromHex(0x514A73),
    };
    [@"📊 今日 Codex 本地用量" drawAtPoint:NSMakePoint(16, 12)
                              withAttributes:titleAttributes];

    if (self.loading) {
        [@"正在扫描本地会话…" drawAtPoint:NSMakePoint(16, 48)
                                withAttributes:@{
            NSFontAttributeName: [NSFont systemFontOfSize:14 weight:NSFontWeightMedium],
            NSForegroundColorAttributeName: ColorFromHex(0x756E91),
        }];
        return;
    }
    if (self.errorMessage != nil) {
        [self.errorMessage drawInRect:NSMakeRect(16, 42, NSWidth(self.bounds) - 32, 42)
                       withAttributes:@{
            NSFontAttributeName: [NSFont systemFontOfSize:13 weight:NSFontWeightMedium],
            NSForegroundColorAttributeName: ColorFromHex(0xC23B66),
        }];
        return;
    }

    BOOL healthy = !self.calibrationEnabled || self.targetReached;
    NSString *total = FormatTokenCount(self.totalTokens);
    [total drawAtPoint:NSMakePoint(16, 36) withAttributes:@{
        NSFontAttributeName: [NSFont monospacedDigitSystemFontOfSize:24
                                                              weight:NSFontWeightHeavy],
        NSForegroundColorAttributeName: healthy ? ColorFromHex(0x5B2CC9)
                                                : ColorFromHex(0xC23B66),
    }];
    NSString *status;
    if (!self.calibrationEnabled) {
        status = @"本地会话统计";
    } else if (self.targetReached) {
        status = [NSString stringWithFormat:@"✓ 本地目标 %@", FormatTokenCount(self.targetTokens)];
    } else {
        status = @"会话用量已超过展示目标";
    }
    [status drawAtPoint:NSMakePoint(150, 43) withAttributes:@{
        NSFontAttributeName: [NSFont systemFontOfSize:12 weight:NSFontWeightSemibold],
        NSForegroundColorAttributeName: healthy ? ColorFromHex(0x198A73)
                                                : ColorFromHex(0xC23B66),
    }];

    NSRect trackRect = NSMakeRect(16, 76, NSWidth(self.bounds) - 32, 14);
    NSBezierPath *track = [NSBezierPath bezierPathWithRoundedRect:trackRect
                                                         xRadius:7 yRadius:7];
    [ColorFromHex(0xE7E3F5) setFill];
    [track fill];

    unsigned long long scale = MAX(self.totalTokens, self.targetTokens);
    double denominator = scale > 0 ? (double)scale : 1.0;
    double realFraction = MIN(1.0, self.realTokens / denominator);
    double totalFraction = MIN(1.0, self.totalTokens / denominator);
    NSRect totalRect = trackRect;
    totalRect.size.width = trackRect.size.width * totalFraction;
    NSBezierPath *totalBar = [NSBezierPath bezierPathWithRoundedRect:totalRect
                                                             xRadius:7 yRadius:7];
    NSGradient *gradient = [[NSGradient alloc]
        initWithStartingColor:ColorFromHex(0xA445F2)
                  endingColor:ColorFromHex(0x19C3E6)];
    [gradient drawInBezierPath:totalBar angle:0];
    NSRect realRect = trackRect;
    realRect.size.width = trackRect.size.width * realFraction;
    if (realRect.size.width > 0.5) {
        NSBezierPath *realBar = [NSBezierPath bezierPathWithRoundedRect:realRect
                                                               xRadius:7 yRadius:7];
        [ColorFromHex(0xFF5B8D) setFill];
        [realBar fill];
    }

    NSString *details = [NSString stringWithFormat:
        @"会话 %@   展示增量 %@", FormatTokenCount(self.realTokens),
        FormatTokenCount(self.adjustmentTokens)];
    [details drawAtPoint:NSMakePoint(16, 96) withAttributes:@{
        NSFontAttributeName: [NSFont monospacedDigitSystemFontOfSize:11
                                                              weight:NSFontWeightMedium],
        NSForegroundColorAttributeName: ColorFromHex(0x625B7D),
    }];
    NSString *maxLabel = self.calibrationEnabled
        ? [NSString stringWithFormat:@"目标 %@", FormatTokenCount(self.targetTokens)]
        : @"实时读取 ~/.codex/sessions";
    NSSize maxSize = [maxLabel sizeWithAttributes:@{
        NSFontAttributeName: [NSFont systemFontOfSize:9],
    }];
    [maxLabel drawAtPoint:NSMakePoint(NSMaxX(trackRect) - maxSize.width, 96)
           withAttributes:@{
        NSFontAttributeName: [NSFont systemFontOfSize:9 weight:NSFontWeightMedium],
        NSForegroundColorAttributeName: ColorFromHex(0x756E91),
    }];
}

@end

@interface AppDelegate : NSObject <NSApplicationDelegate>
@property(nonatomic, strong) NSStatusItem *statusItem;
@property(nonatomic, strong) NSMenu *providerMenu;
@property(nonatomic, strong) NSWindow *window;
@property(nonatomic, strong) NSTextField *currentProviderLabel;
@property(nonatomic, strong) NSTextField *providerDescriptionLabel;
@property(nonatomic, strong) DopamineButton *gptButton;
@property(nonatomic, strong) DopamineButton *hybridButton;
@property(nonatomic, strong) DopamineButton *deepSeekButton;
@property(nonatomic, strong) UsageChartView *usageChartView;
@property(nonatomic, strong) NSTextField *uploadDestinationLabel;
@property(nonatomic, strong) NSDictionary *latestUsageSummary;
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

    if ([[NSUserDefaults standardUserDefaults]
            boolForKey:@"dump-window-frame"]) {
        dispatch_after(
            dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.8 * NSEC_PER_SEC)),
            dispatch_get_main_queue(),
            ^{
                fprintf(stdout, "WINDOW_FRAME=%s\n",
                        NSStringFromRect(self.window.frame).UTF8String);
                fflush(stdout);
                [NSApp terminate:nil];
            }
        );
    }
}

- (void)buildWindow {
    NSRect frame = NSMakeRect(0, 0, 680, 760);
    self.window = [[NSWindow alloc]
        initWithContentRect:frame
        styleMask:NSWindowStyleMaskTitled |
                  NSWindowStyleMaskClosable |
                  NSWindowStyleMaskMiniaturizable
        backing:NSBackingStoreBuffered
        defer:NO];
    self.window.title = @"Codex 模型切换器";
    self.window.titleVisibility = NSWindowTitleHidden;
    self.window.titlebarAppearsTransparent = YES;
    self.window.styleMask |= NSWindowStyleMaskFullSizeContentView;
    self.window.backgroundColor = NSColor.clearColor;
    self.window.releasedWhenClosed = NO;
    [self.window center];

    GradientBackgroundView *content =
        [[GradientBackgroundView alloc] initWithFrame:frame];
    self.window.contentView = content;

    NSTextField *title = [NSTextField labelWithString:@"✨ Codex 本地控制台 ✨"];
    title.frame = NSMakeRect(28, 700, 624, 36);
    title.font = [NSFont systemFontOfSize:26 weight:NSFontWeightHeavy];
    title.textColor = ColorFromHex(0x2D2A4A);
    [content addSubview:title];

    SectionPanelView *modelPanel = [[SectionPanelView alloc]
        initWithFrame:NSMakeRect(24, 462, 632, 218)];
    [content addSubview:modelPanel];

    NSTextField *modelSectionTitle = [NSTextField labelWithString:
        @"功能一 · 模型切换"];
    modelSectionTitle.frame = NSMakeRect(18, 177, 360, 28);
    modelSectionTitle.font = [NSFont systemFontOfSize:18 weight:NSFontWeightHeavy];
    modelSectionTitle.textColor = ColorFromHex(0x2D2A4A);
    [modelPanel addSubview:modelSectionTitle];

    DopamineButton *settings =
        [[DopamineButton alloc] initWithFrame:NSMakeRect(438, 174, 176, 32)];
    settings.textColor = ColorFromHex(0x2D2A4A);
    settings.target = self;
    settings.action = @selector(showDeepSeekSettings:);
    settings.startColor = [NSColor whiteColor];
    settings.endColor = ColorFromHex(0xDDFBF5);
    settings.title = @"🔑 DeepSeek 设置";
    [modelPanel addSubview:settings];

    self.currentProviderLabel = [NSTextField labelWithString:@"正在读取当前配置…"];
    self.currentProviderLabel.frame = NSMakeRect(18, 140, 596, 26);
    self.currentProviderLabel.font = [NSFont systemFontOfSize:18 weight:NSFontWeightHeavy];
    [modelPanel addSubview:self.currentProviderLabel];

    self.providerDescriptionLabel = [NSTextField labelWithString:
        @"切换后会验证配置，并退出和重新打开 Codex。"];
    self.providerDescriptionLabel.frame = NSMakeRect(18, 114, 596, 22);
    self.providerDescriptionLabel.textColor = ColorFromHex(0x5A5478);
    self.providerDescriptionLabel.font = [NSFont systemFontOfSize:13];
    [modelPanel addSubview:self.providerDescriptionLabel];

    self.gptButton = [[DopamineButton alloc] initWithFrame:NSMakeRect(18, 34, 190, 58)];
    self.gptButton.title = @"🤖 使用 GPT";
    self.gptButton.target = self;
    self.gptButton.action = @selector(selectGPT:);
    self.gptButton.startColor = ColorFromHex(0xFF2E97);
    self.gptButton.endColor = ColorFromHex(0xFF7A00);
    [modelPanel addSubview:self.gptButton];

    self.hybridButton = [[DopamineButton alloc] initWithFrame:NSMakeRect(221, 34, 190, 58)];
    self.hybridButton.title = @"⚡ GPT + DS Subagent";
    self.hybridButton.target = self;
    self.hybridButton.action = @selector(selectHybrid:);
    self.hybridButton.startColor = ColorFromHex(0x7B2CBF);
    self.hybridButton.endColor = ColorFromHex(0x00B4FF);
    [modelPanel addSubview:self.hybridButton];

    self.deepSeekButton = [[DopamineButton alloc] initWithFrame:NSMakeRect(424, 34, 190, 58)];
    self.deepSeekButton.title = @"🦄 使用 DeepSeek";
    self.deepSeekButton.target = self;
    self.deepSeekButton.action = @selector(selectDeepSeek:);
    self.deepSeekButton.startColor = ColorFromHex(0x3A86FF);
    self.deepSeekButton.endColor = ColorFromHex(0x00E5C7);
    [modelPanel addSubview:self.deepSeekButton];

    SectionPanelView *usagePanel = [[SectionPanelView alloc]
        initWithFrame:NSMakeRect(24, 192, 632, 250)];
    [content addSubview:usagePanel];

    NSTextField *usageSectionTitle = [NSTextField labelWithString:
        @"功能二 · 用量中心"];
    usageSectionTitle.frame = NSMakeRect(18, 207, 596, 28);
    usageSectionTitle.font = [NSFont systemFontOfSize:18 weight:NSFontWeightHeavy];
    usageSectionTitle.textColor = ColorFromHex(0x2D2A4A);
    [usagePanel addSubview:usageSectionTitle];

    NSTextField *usageSectionDescription = [NSTextField labelWithString:
        @"用量来自本地会话；展示值调整不会改写会话。"];
    usageSectionDescription.frame = NSMakeRect(18, 182, 596, 20);
    usageSectionDescription.font = [NSFont systemFontOfSize:12];
    usageSectionDescription.textColor = ColorFromHex(0x5A5478);
    [usagePanel addSubview:usageSectionDescription];

    DopamineButton *refresh =
        [[DopamineButton alloc] initWithFrame:NSMakeRect(18, 16, 155, 34)];
    refresh.textColor = ColorFromHex(0x2D2A4A);
    refresh.target = self;
    refresh.action = @selector(refreshStatus:);
    refresh.startColor = [NSColor whiteColor];
    refresh.endColor = ColorFromHex(0xE9E4FF);
    refresh.title = @"🔄 刷新用量";
    [usagePanel addSubview:refresh];

    DopamineButton *usageTarget =
        [[DopamineButton alloc] initWithFrame:NSMakeRect(338, 16, 134, 34)];
    usageTarget.textColor = ColorFromHex(0x2D2A4A);
    usageTarget.target = self;
    usageTarget.action = @selector(showUsageTarget:);
    usageTarget.startColor = [NSColor whiteColor];
    usageTarget.endColor = ColorFromHex(0xFFE9F2);
    usageTarget.title = @"✏️ 自定展示值";
    [usagePanel addSubview:usageTarget];

    DopamineButton *randomTarget =
        [[DopamineButton alloc] initWithFrame:NSMakeRect(181, 16, 149, 34)];
    randomTarget.textColor = ColorFromHex(0x2D2A4A);
    randomTarget.target = self;
    randomTarget.action = @selector(randomizeUsageTarget:);
    randomTarget.startColor = [NSColor whiteColor];
    randomTarget.endColor = ColorFromHex(0xE6F4FF);
    randomTarget.title = @"🎲 随机展示值";
    [usagePanel addSubview:randomTarget];

    DopamineButton *clearTarget =
        [[DopamineButton alloc] initWithFrame:NSMakeRect(480, 16, 134, 34)];
    clearTarget.textColor = ColorFromHex(0x2D2A4A);
    clearTarget.target = self;
    clearTarget.action = @selector(clearUsageTarget:);
    clearTarget.startColor = [NSColor whiteColor];
    clearTarget.endColor = ColorFromHex(0xFFF1D6);
    clearTarget.title = @"↩️ 恢复会话值";
    [usagePanel addSubview:clearTarget];

    self.usageChartView = [[UsageChartView alloc]
        initWithFrame:NSMakeRect(18, 62, 596, 112)];
    [self.usageChartView showLoading];
    [usagePanel addSubview:self.usageChartView];

    SectionPanelView *uploadPanel = [[SectionPanelView alloc]
        initWithFrame:NSMakeRect(24, 62, 632, 110)];
    [content addSubview:uploadPanel];

    NSTextField *uploadSectionTitle = [NSTextField labelWithString:
        @"功能三 · Vibe Cafe 同步"];
    uploadSectionTitle.frame = NSMakeRect(18, 70, 300, 26);
    uploadSectionTitle.font = [NSFont systemFontOfSize:17 weight:NSFontWeightHeavy];
    uploadSectionTitle.textColor = ColorFromHex(0x2D2A4A);
    [uploadPanel addSubview:uploadSectionTitle];

    NSTextField *uploadDescription = [NSTextField labelWithString:
        @"同步会话记录，或上传当前展示用量。"];
    uploadDescription.frame = NSMakeRect(18, 48, 440, 18);
    uploadDescription.font = [NSFont systemFontOfSize:11];
    uploadDescription.textColor = ColorFromHex(0x5A5478);
    [uploadPanel addSubview:uploadDescription];

    self.uploadDestinationLabel = [NSTextField labelWithString:
        [NSFileManager.defaultManager fileExistsAtPath:VibeUsageConfigPath()]
            ? @"目的地：vibecafe.ai/usage · 已绑定"
            : @"目的地：vibecafe.ai/usage · 尚未绑定"];
    self.uploadDestinationLabel.frame = NSMakeRect(18, 17, 250, 20);
    self.uploadDestinationLabel.font = [NSFont systemFontOfSize:11 weight:NSFontWeightMedium];
    self.uploadDestinationLabel.textColor = ColorFromHex(0x6B6390);
    self.uploadDestinationLabel.lineBreakMode = NSLineBreakByTruncatingMiddle;
    [uploadPanel addSubview:self.uploadDestinationLabel];

    DopamineButton *syncReal = [[DopamineButton alloc]
        initWithFrame:NSMakeRect(354, 17, 120, 34)];
    syncReal.target = self;
    syncReal.action = @selector(uploadUsageSummary:);
    syncReal.startColor = ColorFromHex(0x7B2CBF);
    syncReal.endColor = ColorFromHex(0x00B4FF);
    syncReal.title = @"☕ 同步会话";
    [uploadPanel addSubview:syncReal];

    DopamineButton *uploadGray = [[DopamineButton alloc]
        initWithFrame:NSMakeRect(482, 17, 132, 34)];
    uploadGray.target = self;
    uploadGray.action = @selector(uploadGrayUsage:);
    uploadGray.startColor = ColorFromHex(0xFF2E97);
    uploadGray.endColor = ColorFromHex(0xFF7A00);
    uploadGray.title = @"⬆️ 上传展示量";
    [uploadPanel addSubview:uploadGray];

    NSTextField *warning = [NSTextField labelWithString:
        @"⚠️ 请先等待正在运行的 Codex 任务结束，再执行切换。"];
    warning.frame = NSMakeRect(28, 26, 624, 24);
    warning.textColor = ColorFromHex(0x6B6390);
    warning.font = [NSFont systemFontOfSize:12];
    [content addSubview:warning];
    [self refreshUsage];
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

        NSShadow *shadow = [[NSShadow alloc] init];
        shadow.shadowColor = [NSColor colorWithWhite:1.0 alpha:0.7];
        shadow.shadowOffset = NSMakeSize(0, -1);
        shadow.shadowBlurRadius = 1.0;
        NSDictionary *prefixAttributes = @{
            NSForegroundColorAttributeName: ColorFromHex(0x2D2A4A),
            NSFontAttributeName: [NSFont systemFontOfSize:18 weight:NSFontWeightHeavy],
            NSShadowAttributeName: shadow,
        };
        NSMutableDictionary *modeAttributes = [prefixAttributes mutableCopy];
        modeAttributes[NSForegroundColorAttributeName] = ModeColor(self.selectedMode);
        NSMutableAttributedString *status =
            [[NSMutableAttributedString alloc]
                initWithString:@"✨ 当前：" attributes:prefixAttributes];
        [status appendAttributedString:
            [[NSAttributedString alloc]
                initWithString:ModeDisplayName(self.selectedMode)
                    attributes:modeAttributes]];
        self.currentProviderLabel.attributedStringValue = status;

        self.providerDescriptionLabel.stringValue =
            @"切换后会验证配置，并退出和重新打开 Codex。";
        self.gptButton.title = self.selectedMode == ProviderModeGPT
            ? @"🤖 ✓ 使用 GPT" : @"🤖 使用 GPT";
        self.hybridButton.title = self.selectedMode == ProviderModeHybrid
            ? @"⚡ ✓ GPT + DS" : @"⚡ GPT + DS Subagent";
        self.deepSeekButton.title = self.selectedMode == ProviderModeDeepSeek
            ? @"🦄 ✓ 使用 DeepSeek" : @"🦄 使用 DeepSeek";
    } else {
        self.statusItem.button.title = @"?";
        self.statusItem.button.toolTip = @"Codex Provider 配置不可用";
        self.currentProviderLabel.stringValue = @"⚠️ 当前配置不可用";
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
            @"✨ 当前：%@ %@", ModeEmoji(self.selectedMode), ModeDisplayName(self.selectedMode)]
        action:nil
        keyEquivalent:@""];
    current.enabled = NO;
    [menu addItem:current];
    [menu addItem:NSMenuItem.separatorItem];

    NSMenuItem *gpt = [[NSMenuItem alloc]
        initWithTitle:@"🤖 使用 GPT"
        action:@selector(selectGPT:)
        keyEquivalent:@""];
    gpt.target = self;
    gpt.state = self.selectedMode == ProviderModeGPT
        ? NSControlStateValueOn : NSControlStateValueOff;
    [menu addItem:gpt];

    NSMenuItem *hybrid = [[NSMenuItem alloc]
        initWithTitle:@"⚡ 使用 GPT + DeepSeek Subagent"
        action:@selector(selectHybrid:)
        keyEquivalent:@""];
    hybrid.target = self;
    hybrid.state = self.selectedMode == ProviderModeHybrid
        ? NSControlStateValueOn : NSControlStateValueOff;
    [menu addItem:hybrid];

    NSMenuItem *deepSeek = [[NSMenuItem alloc]
        initWithTitle:@"🦄 使用 DeepSeek"
        action:@selector(selectDeepSeek:)
        keyEquivalent:@""];
    deepSeek.target = self;
    deepSeek.state = self.selectedMode == ProviderModeDeepSeek
        ? NSControlStateValueOn : NSControlStateValueOff;
    [menu addItem:deepSeek];

    [menu addItem:NSMenuItem.separatorItem];

    NSMenuItem *refresh = [[NSMenuItem alloc]
        initWithTitle:@"🔄 刷新状态与用量"
        action:@selector(refreshStatus:)
        keyEquivalent:@"r"];
    refresh.target = self;
    [menu addItem:refresh];

    NSMenuItem *usageTarget = [[NSMenuItem alloc]
        initWithTitle:@"🎯 设定今日 Token 目标"
        action:@selector(showUsageTarget:)
        keyEquivalent:@""];
    usageTarget.target = self;
    [menu addItem:usageTarget];

    NSMenuItem *randomTarget = [[NSMenuItem alloc]
        initWithTitle:@"🎲 随机合理目标（4.5B–5.5B）"
        action:@selector(randomizeUsageTarget:)
        keyEquivalent:@""];
    randomTarget.target = self;
    [menu addItem:randomTarget];

    NSMenuItem *clearTarget = [[NSMenuItem alloc]
        initWithTitle:@"↩️ 恢复会话用量"
        action:@selector(clearUsageTarget:)
        keyEquivalent:@""];
    clearTarget.target = self;
    [menu addItem:clearTarget];

    NSMenuItem *shareUsage = [[NSMenuItem alloc]
        initWithTitle:@"☕ 同步会话记录到 Vibe Cafe"
        action:@selector(uploadUsageSummary:)
        keyEquivalent:@""];
    shareUsage.target = self;
    [menu addItem:shareUsage];

    NSMenuItem *uploadGray = [[NSMenuItem alloc]
        initWithTitle:@"⬆️ 上传当前展示量到 Vibe Cafe"
        action:@selector(uploadGrayUsage:)
        keyEquivalent:@""];
    uploadGray.target = self;
    [menu addItem:uploadGray];

    NSMenuItem *exportUsage = [[NSMenuItem alloc]
        initWithTitle:@"💾 保存用量汇总 JSON"
        action:@selector(exportUsageSummary:)
        keyEquivalent:@""];
    exportUsage.target = self;
    [menu addItem:exportUsage];

    NSMenuItem *openFolder = [[NSMenuItem alloc]
        initWithTitle:@"📂 打开 Codex 配置文件夹"
        action:@selector(openConfigFolder:)
        keyEquivalent:@""];
    openFolder.target = self;
    [menu addItem:openFolder];

    NSMenuItem *settings = [[NSMenuItem alloc]
        initWithTitle:@"🔑 DeepSeek API Key 设置"
        action:@selector(showDeepSeekSettings:)
        keyEquivalent:@""];
    settings.target = self;
    [menu addItem:settings];

    [menu addItem:NSMenuItem.separatorItem];

    NSMenuItem *quit = [[NSMenuItem alloc]
        initWithTitle:@"👋 退出模型切换器"
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

- (void)selectHybrid:(id)sender {
    (void)sender;
    [self requestSwitch:ProviderModeHybrid];
}

- (void)refreshStatus:(id)sender {
    (void)sender;
    [self refreshMenu];
    [self refreshUsage];
}

- (void)refreshUsage {
    [self.usageChartView showLoading];
    dispatch_async(dispatch_get_global_queue(QOS_CLASS_USER_INITIATED, 0), ^{
        NSError *readError = nil;
        NSDictionary *summary = ReadLocalUsageSummary(&readError);
        NSString *failure = readError.localizedDescription;
        dispatch_async(dispatch_get_main_queue(), ^{
            if (summary != nil) {
                self.latestUsageSummary = summary;
                [self.usageChartView updateWithSummary:summary];
            } else {
                self.latestUsageSummary = nil;
                [self.usageChartView showError:failure];
            }
        });
    });
}

- (NSData *)usageReportData:(NSError **)error {
    NSDictionary *summary = self.latestUsageSummary;
    if (summary == nil) {
        summary = ReadLocalUsageSummary(error);
        if (summary == nil) return nil;
        self.latestUsageSummary = summary;
    }
    NSDictionary *payload = @{
        @"schema_version": @1,
        @"source": @"codex-model-switcher",
        @"generated_at": [NSISO8601DateFormatter.new stringFromDate:NSDate.date],
        @"provider_mode": ModeSlug(self.selectedMode),
        @"date": summary[@"date"] ?: @"",
        @"real_tokens": summary[@"real_tokens"] ?: @0,
        @"local_adjustment_tokens": summary[@"adjustment_tokens"] ?: @0,
        @"display_target_tokens": summary[@"target_tokens"] ?: NSNull.null,
        @"display_total_tokens": summary[@"total_tokens"] ?: @0,
        @"files_scanned": summary[@"files_scanned"] ?: @0,
    };
    return [NSJSONSerialization dataWithJSONObject:payload
                                           options:NSJSONWritingPrettyPrinted
                                             error:error];
}

- (NSString *)usageReportFilename {
    NSString *date = self.latestUsageSummary[@"date"] ?: LocalDateString(NSDate.date);
    return [NSString stringWithFormat:@"codex-usage-%@.json", date];
}

- (void)exportUsageSummary:(id)sender {
    (void)sender;
    NSError *error = nil;
    NSData *data = [self usageReportData:&error];
    if (data == nil) {
        ShowAlert(@"导出失败", error.localizedDescription, NSAlertStyleWarning);
        return;
    }

    NSSavePanel *panel = [NSSavePanel savePanel];
    panel.title = @"保存 Codex 用量汇总";
    panel.nameFieldStringValue = [self usageReportFilename];
    panel.canCreateDirectories = YES;
    if ([panel runModal] != NSModalResponseOK) return;
    if (![data writeToURL:panel.URL options:NSDataWritingAtomic error:&error]) {
        ShowAlert(@"导出失败", error.localizedDescription, NSAlertStyleWarning);
        return;
    }
    ShowAlert(@"已保存", @"用量汇总 JSON 已保存到你选择的位置。", NSAlertStyleInformational);
}

- (BOOL)ensureVibeConfigured {
    if (![NSFileManager.defaultManager fileExistsAtPath:VibeUsageConfigPath()]) {
        NSAlert *alert = [[NSAlert alloc] init];
        alert.alertStyle = NSAlertStyleInformational;
        alert.messageText = @"尚未绑定 Vibe Cafe";
        alert.informativeText = @"请先在 Vibe Usage 中登录并链接设备，完成后再回来上传。";
        [alert addButtonWithTitle:@"打开 Vibe Usage"];
        [alert addButtonWithTitle:@"取消"];
        if ([alert runModal] == NSAlertFirstButtonReturn) {
            NSURL *appURL = [NSURL fileURLWithPath:@"/Applications/Vibe Usage.app"];
            [NSWorkspace.sharedWorkspace openURL:appURL];
        }
        return NO;
    }

    if (FindNPXExecutable() == nil) {
        ShowAlert(@"无法同步",
            @"未找到 npx。请先安装 Node.js，或直接使用已安装的 Vibe Usage 应用同步。",
            NSAlertStyleWarning);
        return NO;
    }
    return YES;
}

- (void)runVibeSyncWithExtraHome:(NSString *)extraHome
                           button:(NSButton *)button
                     successTitle:(NSString *)successTitle
                   successMessage:(NSString *)successMessage {
    NSString *npxPath = FindNPXExecutable();

    NSString *originalTitle = button.title;
    button.enabled = NO;
    button.title = @"⏳ 正在同步…";

    dispatch_async(dispatch_get_global_queue(QOS_CLASS_USER_INITIATED, 0), ^{
        NSTask *task = [[NSTask alloc] init];
        task.executableURL = [NSURL fileURLWithPath:npxPath];
        NSMutableArray<NSString *> *arguments = [NSMutableArray arrayWithArray:
            @[@"--yes", @"@vibe-cafe/vibe-usage@latest", @"sync"]];
        if (extraHome.length > 0) {
            [arguments addObjectsFromArray:@[@"--extra-codex-home", extraHome]];
        }
        task.arguments = arguments;
        task.currentDirectoryURL = [NSURL fileURLWithPath:NSHomeDirectory() isDirectory:YES];
        NSMutableDictionary *environment = [NSProcessInfo.processInfo.environment mutableCopy];
        environment[@"PATH"] = [NSString stringWithFormat:
            @"%@/.local/bin:%@/.npm-global/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin",
            NSHomeDirectory(), NSHomeDirectory()];
        environment[@"NO_COLOR"] = @"1";
        task.environment = environment;
        NSPipe *pipe = [NSPipe pipe];
        task.standardOutput = pipe;
        task.standardError = pipe;

        NSError *launchError = nil;
        BOOL launched = [task launchAndReturnError:&launchError];
        NSData *outputData = [NSData data];
        if (launched) {
            [task waitUntilExit];
            outputData = [pipe.fileHandleForReading readDataToEndOfFile];
        }
        int status = launched ? task.terminationStatus : -1;
        NSString *output = SanitizedVibeOutput(outputData);

        dispatch_async(dispatch_get_main_queue(), ^{
            button.enabled = YES;
            button.title = originalTitle;
            if (!launched || status != 0) {
                NSString *message = launchError.localizedDescription;
                if (message.length == 0) message = output;
                if (message.length == 0) {
                    message = [NSString stringWithFormat:@"vibe-usage 退出码：%d", status];
                }
                ShowAlert(@"Vibe Cafe 同步失败", message, NSAlertStyleWarning);
            } else {
                ShowAlert(successTitle, successMessage, NSAlertStyleInformational);
            }
        });
    });
}

- (void)uploadUsageSummary:(id)sender {
    if (![self ensureVibeConfigured]) return;
    NSButton *button = [sender isKindOfClass:NSButton.class] ? sender : nil;
    [self runVibeSyncWithExtraHome:nil
                            button:button
                      successTitle:@"已上传到 Vibe Cafe"
                    successMessage:@"Codex 会话用量已通过官方 vibe-usage 同步。"];
}

- (NSString *)writeGrayUsagePayload:(NSError **)error {
    NSDictionary *summary = self.latestUsageSummary ?: ReadLocalUsageSummary(error);
    if (summary == nil) return nil;
    self.latestUsageSummary = summary;
    unsigned long long adjustment = [summary[@"adjustment_tokens"] unsignedLongLongValue];
    if (adjustment == 0) {
        if (error != NULL) *error = SwitcherError(@"请先设定随机或自定展示值。");
        return nil;
    }

    NSString *date = summary[@"date"] ?: LocalDateString(NSDate.date);
    NSArray<NSString *> *parts = [date componentsSeparatedByString:@"-"];
    if (parts.count != 3) {
        if (error != NULL) *error = SwitcherError(@"无法确定用量包日期。");
        return nil;
    }
    NSArray<NSDictionary *> *profile = @[
        @{@"h": @7, @"w": @58}, @{@"h": @8, @"w": @575},
        @{@"h": @9, @"w": @2504}, @{@"h": @10, @"w": @1155},
        @{@"h": @11, @"w": @851}, @{@"h": @12, @"w": @65},
        @{@"h": @13, @"w": @57}, @{@"h": @14, @"w": @1472},
        @{@"h": @15, @"w": @779}, @{@"h": @16, @"w": @867},
        @{@"h": @17, @"w": @588}, @{@"h": @18, @"w": @226},
        @{@"h": @19, @"w": @90}, @{@"h": @20, @"w": @157},
        @{@"h": @21, @"w": @199}, @{@"h": @22, @"w": @186},
    ];
    NSCalendar *calendar = NSCalendar.currentCalendar;
    NSDateComponents *now = [calendar components:NSCalendarUnitHour | NSCalendarUnitMinute
                                         fromDate:NSDate.date];
    NSMutableArray<NSDictionary *> *slots = [NSMutableArray array];
    unsigned long long totalWeight = 0;
    for (NSDictionary *item in profile) {
        NSInteger hour = [item[@"h"] integerValue];
        NSInteger weight = [item[@"w"] integerValue];
        for (NSNumber *minuteValue in @[@0, @30]) {
            NSInteger minute = minuteValue.integerValue;
            if (hour > now.hour || (hour == now.hour && minute > now.minute)) continue;
            NSInteger slotWeight = minute == 0 ? weight * 47 : weight * 53;
            [slots addObject:@{@"h": @(hour), @"m": @(minute), @"w": @(slotWeight)}];
            totalWeight += (unsigned long long)slotWeight;
        }
    }
    if (slots.count == 0) {
        [slots addObject:@{@"h": @(MAX(0, now.hour - 1)), @"m": @0, @"w": @1}];
        totalWeight = 1;
    }

    NSData *configData = [NSData dataWithContentsOfFile:VibeUsageConfigPath()];
    id configObject = configData == nil ? nil :
        [NSJSONSerialization JSONObjectWithData:configData options:0 error:NULL];
    NSDictionary *config = [configObject isKindOfClass:NSDictionary.class]
        ? configObject : @{};
    NSString *hostname = [config[@"hostname"] isKindOfClass:NSString.class]
        ? config[@"hostname"] : NSProcessInfo.processInfo.hostName;
    NSString *model = self.selectedMode == ProviderModeDeepSeek
        ? @"deepseek-chat" : @"gpt-5.6-sol";
    NSMutableArray *buckets = [NSMutableArray array];
    NSISO8601DateFormatter *iso = [[NSISO8601DateFormatter alloc] init];
    unsigned long long distributed = 0;
    for (NSUInteger index = 0; index < slots.count; index++) {
        NSDictionary *slot = slots[index];
        unsigned long long chunk = index + 1 == slots.count
            ? adjustment - distributed
            : adjustment * [slot[@"w"] unsignedLongLongValue] / totalWeight;
        distributed += chunk;
        unsigned long long rawOutput = chunk * 32ULL / 10000ULL;
        unsigned long long rawInput = chunk - rawOutput;
        unsigned long long cached = rawInput * 9602ULL / 10000ULL;
        unsigned long long reasoning = rawOutput * 271ULL / 1000ULL;
        unsigned long long input = rawInput - cached;
        unsigned long long output = rawOutput - reasoning;
        NSDateComponents *stamp = [[NSDateComponents alloc] init];
        stamp.year = parts[0].integerValue;
        stamp.month = parts[1].integerValue;
        stamp.day = parts[2].integerValue;
        stamp.hour = [slot[@"h"] integerValue];
        stamp.minute = [slot[@"m"] integerValue];
        NSDate *bucketDate = [calendar dateFromComponents:stamp];
        [buckets addObject:@{
            @"source": @"codex", @"model": model,
            @"project": @"TUARAN/tuaran-home-page", @"hostname": hostname,
            @"bucketStart": [iso stringFromDate:bucketDate],
            @"inputTokens": @(input), @"outputTokens": @(output),
            @"cachedInputTokens": @(cached),
            @"reasoningOutputTokens": @(reasoning),
            @"cacheCreation5mTokens": @0, @"cacheCreation1hTokens": @0,
            @"totalTokens": @(chunk),
        }];
    }
    NSString *runID = [NSString stringWithFormat:@"gray-%@-%@", date, hostname];
    NSDictionary *payload = @{
        @"buckets": buckets,
        @"_provenance": @{
            @"synthetic": @YES,
            @"cohort": @"gray-ranking-2026-09",
            @"runId": runID,
            @"generatorVersion": @1,
            @"visibility": @"internal",
            @"distributionSource": @"local-30d-hour-profile",
            @"generatedAt": [iso stringFromDate:NSDate.date],
            @"adjustmentTokensSnapshot": @(adjustment),
        },
        @"client": @{
            @"surface": @"codex-model-switcher",
            @"hostname": hostname,
            @"grayPayloadVersion": @1,
            @"grayProvenance": @{
                @"synthetic": @YES,
                @"cohort": @"gray-ranking-2026-09",
                @"runId": runID,
            },
        },
    };
    NSData *data = [NSJSONSerialization dataWithJSONObject:payload
                                                   options:NSJSONWritingPrettyPrinted
                                                     error:error];
    if (data == nil) return nil;
    NSString *folder = [NSHomeDirectory() stringByAppendingPathComponent:
        @".vibe-usage/gray-pending"];
    if (![NSFileManager.defaultManager createDirectoryAtPath:folder
                                  withIntermediateDirectories:YES
                                                   attributes:nil error:error]) return nil;
    NSString *file = [folder stringByAppendingPathComponent:
        [NSString stringWithFormat:@"gray-usage-%@.json", date]];
    return [data writeToFile:file options:NSDataWritingAtomic error:error] ? file : nil;
}

- (void)uploadGrayUsage:(id)sender {
    NSData *configData = [NSData dataWithContentsOfFile:VibeUsageConfigPath()];
    id configObject = configData == nil ? nil :
        [NSJSONSerialization JSONObjectWithData:configData options:0 error:NULL];
    NSDictionary *config = [configObject isKindOfClass:NSDictionary.class]
        ? configObject : nil;
    NSString *apiKey = [config[@"apiKey"] isKindOfClass:NSString.class]
        ? config[@"apiKey"] : nil;
    NSString *apiURLString = [config[@"apiUrl"] isKindOfClass:NSString.class]
        ? config[@"apiUrl"] : @"https://vibecafe.ai";
    if (apiKey.length == 0) {
        ShowAlert(@"尚未绑定 Vibe Cafe",
            @"请先使用 Vibe Usage 绑定账号，再上传展示量。",
            NSAlertStyleWarning);
        return;
    }

    NSError *error = nil;
    NSString *file = [self writeGrayUsagePayload:&error];
    NSData *body = file == nil ? nil : [NSData dataWithContentsOfFile:file
                                                               options:0 error:&error];
    id payloadObject = body == nil ? nil :
        [NSJSONSerialization JSONObjectWithData:body options:0 error:&error];
    NSDictionary *payload = [payloadObject isKindOfClass:NSDictionary.class]
        ? payloadObject : nil;
    if (payload == nil) {
        ShowAlert(@"无法准备用量包", error.localizedDescription, NSAlertStyleWarning);
        return;
    }
    unsigned long long total = 0;
    for (NSDictionary *bucket in payload[@"buckets"]) {
        total += [bucket[@"totalTokens"] unsignedLongLongValue];
    }
    NSString *runID = payload[@"_provenance"][@"runId"] ?: @"gray-unknown";
    NSURL *baseURL = [NSURL URLWithString:apiURLString];
    NSURL *uploadURL = [NSURL URLWithString:@"/api/usage/ingest" relativeToURL:baseURL].absoluteURL;
    if (uploadURL == nil) {
        ShowAlert(@"上传地址无效", apiURLString, NSAlertStyleWarning);
        return;
    }

    NSAlert *confirm = [[NSAlert alloc] init];
    confirm.alertStyle = NSAlertStyleWarning;
    confirm.messageText = @"上传当前展示量到 Vibe Cafe？";
    confirm.informativeText = [NSString stringWithFormat:
        @"将上传 %@（%lu 个时间桶）到 %@。\n\n请求会携带内部批次和运行标识，便于服务端追溯与清理。",
        FormatTokenCount(total), (unsigned long)[payload[@"buckets"] count], uploadURL.host];
    [confirm addButtonWithTitle:@"上传"];
    [confirm addButtonWithTitle:@"取消"];
    if ([confirm runModal] != NSAlertFirstButtonReturn) return;

    NSButton *button = [sender isKindOfClass:NSButton.class] ? sender : nil;
    NSString *originalTitle = button.title;
    button.enabled = NO;
    button.title = @"⏳ 上传中…";

    NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:uploadURL];
    request.HTTPMethod = @"POST";
    request.timeoutInterval = 60.0;
    request.HTTPBody = body;
    [request setValue:@"application/json" forHTTPHeaderField:@"Content-Type"];
    [request setValue:[@"Bearer " stringByAppendingString:apiKey]
        forHTTPHeaderField:@"Authorization"];
    [request setValue:@"gray" forHTTPHeaderField:@"X-Vibe-Usage-Mode"];
    [request setValue:runID forHTTPHeaderField:@"X-Vibe-Usage-Run-Id"];

    NSURLSessionDataTask *task = [NSURLSession.sharedSession
        dataTaskWithRequest:request
        completionHandler:^(NSData *responseData, NSURLResponse *response, NSError *requestError) {
            NSHTTPURLResponse *http = [response isKindOfClass:NSHTTPURLResponse.class]
                ? (NSHTTPURLResponse *)response : nil;
            NSString *responseText = responseData.length == 0 ? @"" :
                [[NSString alloc] initWithData:responseData encoding:NSUTF8StringEncoding];
            if (responseText.length > 1200) {
                responseText = [[responseText substringToIndex:1200]
                    stringByAppendingString:@"…"];
            }
            dispatch_async(dispatch_get_main_queue(), ^{
                button.enabled = YES;
                button.title = originalTitle;
                if (requestError != nil || http.statusCode < 200 || http.statusCode >= 300) {
                    NSString *message = requestError.localizedDescription;
                    if (message.length == 0) {
                        message = [NSString stringWithFormat:@"HTTP %ld%@%@",
                            (long)http.statusCode,
                            responseText.length > 0 ? @"\n\n" : @"",
                            responseText ?: @""];
                    }
                    ShowAlert(@"用量包上传失败", message, NSAlertStyleWarning);
                    return;
                }
                ShowAlert(@"用量包已上传",
                    [NSString stringWithFormat:@"%@ 已发送到 Vibe Cafe。\n运行标识：%@",
                        FormatTokenCount(total), runID],
                    NSAlertStyleInformational);
            });
        }];
    [task resume];
}

- (void)showUsageTarget:(id)sender {
    (void)sender;
    NSAlert *alert = [[NSAlert alloc] init];
    alert.messageText = @"设定今日 Token 展示目标";
    alert.informativeText = @"输入 10B、500M 或精确整数；也可以随机生成 4.5B–5.5B 的合理目标。只影响本地展示。";
    NSTextField *field = [[NSTextField alloc] initWithFrame:NSMakeRect(0, 0, 320, 26)];
    field.placeholderString = @"10B";
    field.stringValue = @"10B";
    alert.accessoryView = field;
    [alert addButtonWithTitle:@"设定输入值"];
    [alert addButtonWithTitle:@"🎲 随机目标"];
    [alert addButtonWithTitle:@"取消"];
    NSModalResponse response = [alert runModal];
    if (response == NSAlertSecondButtonReturn) {
        [self randomizeUsageTarget:nil];
        return;
    }
    if (response != NSAlertFirstButtonReturn) return;

    NSError *error = nil;
    if (!SaveUsageTarget(field.stringValue, &error)) {
        ShowAlert(@"设定失败", error.localizedDescription, NSAlertStyleWarning);
        return;
    }
    [self refreshUsage];
}

- (void)randomizeUsageTarget:(id)sender {
    (void)sender;
    NSNumber *target = RandomReasonableUsageTarget();
    NSError *error = nil;
    if (!SaveUsageTargetNumber(target, &error)) {
        ShowAlert(@"随机目标失败", error.localizedDescription, NSAlertStyleWarning);
        return;
    }
    [self refreshUsage];
}

- (void)clearUsageTarget:(id)sender {
    (void)sender;
    NSAlert *alert = [[NSAlert alloc] init];
    alert.alertStyle = NSAlertStyleWarning;
    alert.messageText = @"清除今日用量校准？";
    alert.informativeText = @"清除后恢复显示从本地会话读取的用量。";
    [alert addButtonWithTitle:@"清除"];
    [alert addButtonWithTitle:@"取消"];
    if ([alert runModal] != NSAlertFirstButtonReturn) return;

    NSError *error = nil;
    if (!ClearUsageTarget(&error)) {
        ShowAlert(@"清除失败", error.localizedDescription, NSAlertStyleWarning);
        return;
    }
    [self refreshUsage];
}

- (void)openConfigFolder:(id)sender {
    (void)sender;
    NSString *path = [NSHomeDirectory() stringByAppendingPathComponent:@".codex"];
    [NSWorkspace.sharedWorkspace openURL:[NSURL fileURLWithPath:path]];
}

- (void)showDeepSeekSettings:(id)sender {
    (void)sender;
    NSAlert *alert = [[NSAlert alloc] init];
    alert.messageText = @"DeepSeek API Key（当前登录会话）";
    alert.informativeText = @"Key 只注入当前 macOS 登录会话，不写入磁盘或钥匙串。重启电脑后需要重新输入。";
    NSSecureTextField *field = [[NSSecureTextField alloc] initWithFrame:NSMakeRect(0, 0, 360, 26)];
    field.placeholderString = @"sk-…";
    alert.accessoryView = field;
    [alert addButtonWithTitle:@"用于当前会话"];
    [alert addButtonWithTitle:@"清除当前会话 Key"];
    [alert addButtonWithTitle:@"取消"];
    NSModalResponse response = [alert runModal];
    if (response == NSAlertFirstButtonReturn) {
        NSString *key = [field.stringValue stringByTrimmingCharactersInSet:NSCharacterSet.whitespaceAndNewlineCharacterSet];
        if (key.length < 8) {
            ShowAlert(@"没有保存", @"请输入有效的 DeepSeek API Key。", NSAlertStyleWarning);
            return;
        }
        ExportKeyToLaunchd([key dataUsingEncoding:NSUTF8StringEncoding]);
        ShowAlert(@"已启用", @"Key 已为当前登录会话启用，没有写入磁盘或钥匙串。", NSAlertStyleInformational);
    } else if (response == NSAlertSecondButtonReturn) {
        NSTask *task = [[NSTask alloc] init];
        task.executableURL = [NSURL fileURLWithPath:@"/bin/launchctl"];
        task.arguments = @[@"unsetenv", @"DEEPSEEK_API_KEY"];
        [task launchAndReturnError:NULL];
        ShowAlert(@"已清除", @"DeepSeek API Key 已从当前登录会话移除。", NSAlertStyleInformational);
    }
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
