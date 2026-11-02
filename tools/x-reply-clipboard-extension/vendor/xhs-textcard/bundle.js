/**
 * Minified by jsDelivr using Terser v5.19.2.
 * Original file: /npm/marked@15.0.0/lib/marked.umd.js
 *
 * Do NOT use SRI with dynamically generated files! More information: https://www.jsdelivr.com/using-sri-with-dynamic-files
 */
!function(e,t){"object"==typeof exports&&"undefined"!=typeof module?t(exports):"function"==typeof define&&define.amd?define(["exports"],t):t((e="undefined"!=typeof globalThis?globalThis:e||self).marked={})}(this,(function(e){"use strict";function t(){return{async:!1,breaks:!1,extensions:null,gfm:!0,hooks:null,pedantic:!1,renderer:null,silent:!1,tokenizer:null,walkTokens:null}}function n(t){e.defaults=t}e.defaults={async:!1,breaks:!1,extensions:null,gfm:!0,hooks:null,pedantic:!1,renderer:null,silent:!1,tokenizer:null,walkTokens:null};const s={exec:()=>null};function r(e,t=""){let n="string"==typeof e?e:e.source;const s={replace:(e,t)=>{let r="string"==typeof t?t:t.source;return r=r.replace(i.caret,"$1"),n=n.replace(e,r),s},getRegex:()=>new RegExp(n,t)};return s}const i={codeRemoveIndent:/^(?: {1,4}| {0,3}\t)/gm,outputLinkReplace:/\\([\[\]])/g,indentCodeCompensation:/^(\s+)(?:```)/,beginningSpace:/^\s+/,endingHash:/#$/,startingSpaceChar:/^ /,endingSpaceChar:/ $/,nonSpaceChar:/[^ ]/,newLineCharGlobal:/\n/g,tabCharGlobal:/\t/g,multipleSpaceGlobal:/\s+/g,blankLine:/^[ \t]*$/,doubleBlankLine:/\n[ \t]*\n[ \t]*$/,blockquoteStart:/^ {0,3}>/,blockquoteSetextReplace:/\n {0,3}((?:=+|-+) *)(?=\n|$)/g,blockquoteSetextReplace2:/^ {0,3}>[ \t]?/gm,listReplaceTabs:/^\t+/,listReplaceNesting:/^ {1,4}(?=( {4})*[^ ])/g,listIsTask:/^\[[ xX]\] /,listReplaceTask:/^\[[ xX]\] +/,anyLine:/\n.*\n/,hrefBrackets:/^<(.*)>$/,tableDelimiter:/[:|]/,tableAlignChars:/^\||\| *$/g,tableRowBlankLine:/\n[ \t]*$/,tableAlignRight:/^ *-+: *$/,tableAlignCenter:/^ *:-+: *$/,tableAlignLeft:/^ *:-+ *$/,startATag:/^<a /i,endATag:/^<\/a>/i,startPreScriptTag:/^<(pre|code|kbd|script)(\s|>)/i,endPreScriptTag:/^<\/(pre|code|kbd|script)(\s|>)/i,startAngleBracket:/^</,endAngleBracket:/>$/,pedanticHrefTitle:/^([^'"]*[^\s])\s+(['"])(.*)\2/,unicodeAlphaNumeric:/[\p{L}\p{N}]/u,escapeTest:/[&<>"']/,escapeReplace:/[&<>"']/g,escapeTestNoEncode:/[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/,escapeReplaceNoEncode:/[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/g,unescapeTest:/&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/gi,caret:/(^|[^\[])\^/g,percentDecode:/%25/g,findPipe:/\|/g,splitPipe:/ \|/,slashPipe:/\\\|/g,carriageReturn:/\r\n|\r/g,spaceLine:/^ +$/gm,notSpaceStart:/^\S*/,endingNewline:/\n$/,listItemRegex:e=>new RegExp(`^( {0,3}${e})((?:[\t ][^\\n]*)?(?:\\n|$))`),nextBulletRegex:e=>new RegExp(`^ {0,${Math.min(3,e-1)}}(?:[*+-]|\\d{1,9}[.)])((?:[ \t][^\\n]*)?(?:\\n|$))`),hrRegex:e=>new RegExp(`^ {0,${Math.min(3,e-1)}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`),fencesBeginRegex:e=>new RegExp(`^ {0,${Math.min(3,e-1)}}(?:\`\`\`|~~~)`),headingBeginRegex:e=>new RegExp(`^ {0,${Math.min(3,e-1)}}#`),htmlBeginRegex:e=>new RegExp(`^ {0,${Math.min(3,e-1)}}<(?:[a-z].*>|!--)`,"i")},l=/^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/,o=/(?:[*+-]|\d{1,9}[.)])/,a=r(/^(?!bull |blockCode|fences|blockquote|heading|html)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html))+?)\n {0,3}(=+|-+) *(?:\n+|$)/).replace(/bull/g,o).replace(/blockCode/g,/(?: {4}| {0,3}\t)/).replace(/fences/g,/ {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g,/ {0,3}>/).replace(/heading/g,/ {0,3}#{1,6}/).replace(/html/g,/ {0,3}<[^\n>]+>\n/).getRegex(),c=/^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/,h=/(?!\s*\])(?:\\.|[^\[\]\\])+/,p=r(/^ {0,3}\[(label)\]: *(?:\n[ \t]*)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n[ \t]*)?| *\n[ \t]*)(title))? *(?:\n+|$)/).replace("label",h).replace("title",/(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex(),u=r(/^( {0,3}bull)([ \t][^\n]+?)?(?:\n|$)/).replace(/bull/g,o).getRegex(),g="address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul",k=/<!--(?:-?>|[\s\S]*?(?:-->|$))/,d=r("^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n[ \t]*)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ \t]*)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ \t]*)+\\n|$))","i").replace("comment",k).replace("tag",g).replace("attribute",/ +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex(),f=r(c).replace("hr",l).replace("heading"," {0,3}#{1,6}(?:\\s|$)").replace("|lheading","").replace("|table","").replace("blockquote"," {0,3}>").replace("fences"," {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list"," {0,3}(?:[*+-]|1[.)]) ").replace("html","</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag",g).getRegex(),x={blockquote:r(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph",f).getRegex(),code:/^((?: {4}| {0,3}\t)[^\n]+(?:\n(?:[ \t]*(?:\n|$))*)?)+/,def:p,fences:/^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/,heading:/^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/,hr:l,html:d,lheading:a,list:u,newline:/^(?:[ \t]*(?:\n|$))+/,paragraph:f,table:s,text:/^[^\n]+/},b=r("^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)").replace("hr",l).replace("heading"," {0,3}#{1,6}(?:\\s|$)").replace("blockquote"," {0,3}>").replace("code","(?: {4}| {0,3}\t)[^\\n]").replace("fences"," {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list"," {0,3}(?:[*+-]|1[.)]) ").replace("html","</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag",g).getRegex(),m={...x,table:b,paragraph:r(c).replace("hr",l).replace("heading"," {0,3}#{1,6}(?:\\s|$)").replace("|lheading","").replace("table",b).replace("blockquote"," {0,3}>").replace("fences"," {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list"," {0,3}(?:[*+-]|1[.)]) ").replace("html","</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag",g).getRegex()},w={...x,html:r("^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:\"[^\"]*\"|'[^']*'|\\s[^'\"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))").replace("comment",k).replace(/tag/g,"(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(),def:/^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,heading:/^(#{1,6})(.*)(?:\n+|$)/,fences:s,lheading:/^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/,paragraph:r(c).replace("hr",l).replace("heading"," *#{1,6} *[^\n]").replace("lheading",a).replace("|table","").replace("blockquote"," {0,3}>").replace("|fences","").replace("|list","").replace("|html","").replace("|tag","").getRegex()},y=/^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/,$=/^( {2,}|\\)\n(?!\s*$)/,R="\\p{P}\\p{S}",T=r(/^((?![*_])[\spunctuation])/,"u").replace(/punctuation/g,R).getRegex(),z=r(/^(?:\*+(?:((?!\*)[punct])|[^\s*]))|^_+(?:((?!_)[punct])|([^\s_]))/,"u").replace(/punct/g,R).getRegex(),A=r("^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)[punct](\\*+)(?=[\\s]|$)|[^punct\\s](\\*+)(?!\\*)(?=[punct\\s]|$)|(?!\\*)[punct\\s](\\*+)(?=[^punct\\s])|[\\s](\\*+)(?!\\*)(?=[punct])|(?!\\*)[punct](\\*+)(?!\\*)(?=[punct])|[^punct\\s](\\*+)(?=[^punct\\s])","gu").replace(/punct/g,R).getRegex(),S=r("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)[punct](_+)(?=[\\s]|$)|[^punct\\s](_+)(?!_)(?=[punct\\s]|$)|(?!_)[punct\\s](_+)(?=[^punct\\s])|[\\s](_+)(?!_)(?=[punct])|(?!_)[punct](_+)(?!_)(?=[punct])","gu").replace(/punct/g,R).getRegex(),_=r(/\\([punct])/,"gu").replace(/punct/g,R).getRegex(),I=r(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme",/[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email",/[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex(),L=r(k).replace("(?:--\x3e|$)","--\x3e").getRegex(),B=r("^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>").replace("comment",L).replace("attribute",/\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex(),C=/(?:\[(?:\\.|[^\[\]\\])*\]|\\.|`[^`]*`|[^\[\]\\`])*?/,E=r(/^!?\[(label)\]\(\s*(href)(?:\s+(title))?\s*\)/).replace("label",C).replace("href",/<(?:\\.|[^\n<>\\])+>|[^\s\x00-\x1f]*/).replace("title",/"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex(),q=r(/^!?\[(label)\]\[(ref)\]/).replace("label",C).replace("ref",h).getRegex(),P=r(/^!?\[(ref)\](?:\[\])?/).replace("ref",h).getRegex(),Z={_backpedal:s,anyPunctuation:_,autolink:I,blockSkip:/\[[^[\]]*?\]\((?:\\.|[^\\\(\)]|\((?:\\.|[^\\\(\)])*\))*\)|`[^`]*?`|<[^<>]*?>/g,br:$,code:/^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/,del:s,emStrongLDelim:z,emStrongRDelimAst:A,emStrongRDelimUnd:S,escape:y,link:E,nolink:P,punctuation:T,reflink:q,reflinkSearch:r("reflink|nolink(?!\\()","g").replace("reflink",q).replace("nolink",P).getRegex(),tag:B,text:/^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/,url:s},v={...Z,link:r(/^!?\[(label)\]\((.*?)\)/).replace("label",C).getRegex(),reflink:r(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label",C).getRegex()},Q={...Z,escape:r(y).replace("])","~|])").getRegex(),url:r(/^((?:ftp|https?):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/,"i").replace("email",/[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/).getRegex(),_backpedal:/(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/,del:/^(~~?)(?=[^\s~])((?:\\.|[^\\])*?(?:\\.|[^\s~\\]))\1(?=[^~]|$)/,text:/^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|https?:\/\/|ftp:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/},D={...Q,br:r($).replace("{2,}","*").getRegex(),text:r(Q.text).replace("\\b_","\\b_| {2,}\\n").replace(/\{2,\}/g,"*").getRegex()},M={normal:x,gfm:m,pedantic:w},O={normal:Z,gfm:Q,breaks:D,pedantic:v},j={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"},N=e=>j[e];function G(e,t){if(t){if(i.escapeTest.test(e))return e.replace(i.escapeReplace,N)}else if(i.escapeTestNoEncode.test(e))return e.replace(i.escapeReplaceNoEncode,N);return e}function H(e){try{e=encodeURI(e).replace(i.percentDecode,"%")}catch{return null}return e}function X(e,t){const n=e.replace(i.findPipe,((e,t,n)=>{let s=!1,r=t;for(;--r>=0&&"\\"===n[r];)s=!s;return s?"|":" |"})).split(i.splitPipe);let s=0;if(n[0].trim()||n.shift(),n.length>0&&!n[n.length-1].trim()&&n.pop(),t)if(n.length>t)n.splice(t);else for(;n.length<t;)n.push("");for(;s<n.length;s++)n[s]=n[s].trim().replace(i.slashPipe,"|");return n}function F(e,t,n){const s=e.length;if(0===s)return"";let r=0;for(;r<s;){const i=e.charAt(s-r-1);if(i!==t||n){if(i===t||!n)break;r++}else r++}return e.slice(0,s-r)}function U(e,t,n,s,r){const i=t.href,l=t.title||null,o=e[1].replace(r.other.outputLinkReplace,"$1");if("!"!==e[0].charAt(0)){s.state.inLink=!0;const e={type:"link",raw:n,href:i,title:l,text:o,tokens:s.inlineTokens(o)};return s.state.inLink=!1,e}return{type:"image",raw:n,href:i,title:l,text:o}}class J{options;rules;lexer;constructor(t){this.options=t||e.defaults}space(e){const t=this.rules.block.newline.exec(e);if(t&&t[0].length>0)return{type:"space",raw:t[0]}}code(e){const t=this.rules.block.code.exec(e);if(t){const e=t[0].replace(this.rules.other.codeRemoveIndent,"");return{type:"code",raw:t[0],codeBlockStyle:"indented",text:this.options.pedantic?e:F(e,"\n")}}}fences(e){const t=this.rules.block.fences.exec(e);if(t){const e=t[0],n=function(e,t,n){const s=e.match(n.other.indentCodeCompensation);if(null===s)return t;const r=s[1];return t.split("\n").map((e=>{const t=e.match(n.other.beginningSpace);if(null===t)return e;const[s]=t;return s.length>=r.length?e.slice(r.length):e})).join("\n")}(e,t[3]||"",this.rules);return{type:"code",raw:e,lang:t[2]?t[2].trim().replace(this.rules.inline.anyPunctuation,"$1"):t[2],text:n}}}heading(e){const t=this.rules.block.heading.exec(e);if(t){let e=t[2].trim();if(this.rules.other.endingHash.test(e)){const t=F(e,"#");this.options.pedantic?e=t.trim():t&&!this.rules.other.endingSpaceChar.test(t)||(e=t.trim())}return{type:"heading",raw:t[0],depth:t[1].length,text:e,tokens:this.lexer.inline(e)}}}hr(e){const t=this.rules.block.hr.exec(e);if(t)return{type:"hr",raw:F(t[0],"\n")}}blockquote(e){const t=this.rules.block.blockquote.exec(e);if(t){let e=F(t[0],"\n").split("\n"),n="",s="";const r=[];for(;e.length>0;){let t=!1;const i=[];let l;for(l=0;l<e.length;l++)if(this.rules.other.blockquoteStart.test(e[l]))i.push(e[l]),t=!0;else{if(t)break;i.push(e[l])}e=e.slice(l);const o=i.join("\n"),a=o.replace(this.rules.other.blockquoteSetextReplace,"\n    $1").replace(this.rules.other.blockquoteSetextReplace2,"");n=n?`${n}\n${o}`:o,s=s?`${s}\n${a}`:a;const c=this.lexer.state.top;if(this.lexer.state.top=!0,this.lexer.blockTokens(a,r,!0),this.lexer.state.top=c,0===e.length)break;const h=r[r.length-1];if("code"===h?.type)break;if("blockquote"===h?.type){const t=h,i=t.raw+"\n"+e.join("\n"),l=this.blockquote(i);r[r.length-1]=l,n=n.substring(0,n.length-t.raw.length)+l.raw,s=s.substring(0,s.length-t.text.length)+l.text;break}if("list"!==h?.type);else{const t=h,i=t.raw+"\n"+e.join("\n"),l=this.list(i);r[r.length-1]=l,n=n.substring(0,n.length-h.raw.length)+l.raw,s=s.substring(0,s.length-t.raw.length)+l.raw,e=i.substring(r[r.length-1].raw.length).split("\n")}}return{type:"blockquote",raw:n,tokens:r,text:s}}}list(e){let t=this.rules.block.list.exec(e);if(t){let n=t[1].trim();const s=n.length>1,r={type:"list",raw:"",ordered:s,start:s?+n.slice(0,-1):"",loose:!1,items:[]};n=s?`\\d{1,9}\\${n.slice(-1)}`:`\\${n}`,this.options.pedantic&&(n=s?n:"[*+-]");const i=this.rules.other.listItemRegex(n);let l=!1;for(;e;){let n=!1,s="",o="";if(!(t=i.exec(e)))break;if(this.rules.block.hr.test(e))break;s=t[0],e=e.substring(s.length);let a=t[2].split("\n",1)[0].replace(this.rules.other.listReplaceTabs,(e=>" ".repeat(3*e.length))),c=e.split("\n",1)[0],h=!a.trim(),p=0;if(this.options.pedantic?(p=2,o=a.trimStart()):h?p=t[1].length+1:(p=t[2].search(this.rules.other.nonSpaceChar),p=p>4?1:p,o=a.slice(p),p+=t[1].length),h&&this.rules.other.blankLine.test(c)&&(s+=c+"\n",e=e.substring(c.length+1),n=!0),!n){const t=this.rules.other.nextBulletRegex(p),n=this.rules.other.hrRegex(p),r=this.rules.other.fencesBeginRegex(p),i=this.rules.other.headingBeginRegex(p),l=this.rules.other.htmlBeginRegex(p);for(;e;){const u=e.split("\n",1)[0];let g;if(c=u,this.options.pedantic?(c=c.replace(this.rules.other.listReplaceNesting,"  "),g=c):g=c.replace(this.rules.other.tabCharGlobal,"    "),r.test(c))break;if(i.test(c))break;if(l.test(c))break;if(t.test(c))break;if(n.test(c))break;if(g.search(this.rules.other.nonSpaceChar)>=p||!c.trim())o+="\n"+g.slice(p);else{if(h)break;if(a.replace(this.rules.other.tabCharGlobal,"    ").search(this.rules.other.nonSpaceChar)>=4)break;if(r.test(a))break;if(i.test(a))break;if(n.test(a))break;o+="\n"+c}h||c.trim()||(h=!0),s+=u+"\n",e=e.substring(u.length+1),a=g.slice(p)}}r.loose||(l?r.loose=!0:this.rules.other.doubleBlankLine.test(s)&&(l=!0));let u,g=null;this.options.gfm&&(g=this.rules.other.listIsTask.exec(o),g&&(u="[ ] "!==g[0],o=o.replace(this.rules.other.listReplaceTask,""))),r.items.push({type:"list_item",raw:s,task:!!g,checked:u,loose:!1,text:o,tokens:[]}),r.raw+=s}r.items[r.items.length-1].raw=r.items[r.items.length-1].raw.trimEnd(),r.items[r.items.length-1].text=r.items[r.items.length-1].text.trimEnd(),r.raw=r.raw.trimEnd();for(let e=0;e<r.items.length;e++)if(this.lexer.state.top=!1,r.items[e].tokens=this.lexer.blockTokens(r.items[e].text,[]),!r.loose){const t=r.items[e].tokens.filter((e=>"space"===e.type)),n=t.length>0&&t.some((e=>this.rules.other.anyLine.test(e.raw)));r.loose=n}if(r.loose)for(let e=0;e<r.items.length;e++)r.items[e].loose=!0;return r}}html(e){const t=this.rules.block.html.exec(e);if(t){return{type:"html",block:!0,raw:t[0],pre:"pre"===t[1]||"script"===t[1]||"style"===t[1],text:t[0]}}}def(e){const t=this.rules.block.def.exec(e);if(t){const e=t[1].toLowerCase().replace(this.rules.other.multipleSpaceGlobal," "),n=t[2]?t[2].replace(this.rules.other.hrefBrackets,"$1").replace(this.rules.inline.anyPunctuation,"$1"):"",s=t[3]?t[3].substring(1,t[3].length-1).replace(this.rules.inline.anyPunctuation,"$1"):t[3];return{type:"def",tag:e,raw:t[0],href:n,title:s}}}table(e){const t=this.rules.block.table.exec(e);if(!t)return;if(!this.rules.other.tableDelimiter.test(t[2]))return;const n=X(t[1]),s=t[2].replace(this.rules.other.tableAlignChars,"").split("|"),r=t[3]&&t[3].trim()?t[3].replace(this.rules.other.tableRowBlankLine,"").split("\n"):[],i={type:"table",raw:t[0],header:[],align:[],rows:[]};if(n.length===s.length){for(const e of s)this.rules.other.tableAlignRight.test(e)?i.align.push("right"):this.rules.other.tableAlignCenter.test(e)?i.align.push("center"):this.rules.other.tableAlignLeft.test(e)?i.align.push("left"):i.align.push(null);for(let e=0;e<n.length;e++)i.header.push({text:n[e],tokens:this.lexer.inline(n[e]),header:!0,align:i.align[e]});for(const e of r)i.rows.push(X(e,i.header.length).map(((e,t)=>({text:e,tokens:this.lexer.inline(e),header:!1,align:i.align[t]}))));return i}}lheading(e){const t=this.rules.block.lheading.exec(e);if(t)return{type:"heading",raw:t[0],depth:"="===t[2].charAt(0)?1:2,text:t[1],tokens:this.lexer.inline(t[1])}}paragraph(e){const t=this.rules.block.paragraph.exec(e);if(t){const e="\n"===t[1].charAt(t[1].length-1)?t[1].slice(0,-1):t[1];return{type:"paragraph",raw:t[0],text:e,tokens:this.lexer.inline(e)}}}text(e){const t=this.rules.block.text.exec(e);if(t)return{type:"text",raw:t[0],text:t[0],tokens:this.lexer.inline(t[0])}}escape(e){const t=this.rules.inline.escape.exec(e);if(t)return{type:"escape",raw:t[0],text:t[1]}}tag(e){const t=this.rules.inline.tag.exec(e);if(t)return!this.lexer.state.inLink&&this.rules.other.startATag.test(t[0])?this.lexer.state.inLink=!0:this.lexer.state.inLink&&this.rules.other.endATag.test(t[0])&&(this.lexer.state.inLink=!1),!this.lexer.state.inRawBlock&&this.rules.other.startPreScriptTag.test(t[0])?this.lexer.state.inRawBlock=!0:this.lexer.state.inRawBlock&&this.rules.other.endPreScriptTag.test(t[0])&&(this.lexer.state.inRawBlock=!1),{type:"html",raw:t[0],inLink:this.lexer.state.inLink,inRawBlock:this.lexer.state.inRawBlock,block:!1,text:t[0]}}link(e){const t=this.rules.inline.link.exec(e);if(t){const e=t[2].trim();if(!this.options.pedantic&&this.rules.other.startAngleBracket.test(e)){if(!this.rules.other.endAngleBracket.test(e))return;const t=F(e.slice(0,-1),"\\");if((e.length-t.length)%2==0)return}else{const e=function(e,t){if(-1===e.indexOf(t[1]))return-1;let n=0;for(let s=0;s<e.length;s++)if("\\"===e[s])s++;else if(e[s]===t[0])n++;else if(e[s]===t[1]&&(n--,n<0))return s;return-1}(t[2],"()");if(e>-1){const n=(0===t[0].indexOf("!")?5:4)+t[1].length+e;t[2]=t[2].substring(0,e),t[0]=t[0].substring(0,n).trim(),t[3]=""}}let n=t[2],s="";if(this.options.pedantic){const e=this.rules.other.pedanticHrefTitle.exec(n);e&&(n=e[1],s=e[3])}else s=t[3]?t[3].slice(1,-1):"";return n=n.trim(),this.rules.other.startAngleBracket.test(n)&&(n=this.options.pedantic&&!this.rules.other.endAngleBracket.test(e)?n.slice(1):n.slice(1,-1)),U(t,{href:n?n.replace(this.rules.inline.anyPunctuation,"$1"):n,title:s?s.replace(this.rules.inline.anyPunctuation,"$1"):s},t[0],this.lexer,this.rules)}}reflink(e,t){let n;if((n=this.rules.inline.reflink.exec(e))||(n=this.rules.inline.nolink.exec(e))){const e=t[(n[2]||n[1]).replace(this.rules.other.multipleSpaceGlobal," ").toLowerCase()];if(!e){const e=n[0].charAt(0);return{type:"text",raw:e,text:e}}return U(n,e,n[0],this.lexer,this.rules)}}emStrong(e,t,n=""){let s=this.rules.inline.emStrongLDelim.exec(e);if(!s)return;if(s[3]&&n.match(this.rules.other.unicodeAlphaNumeric))return;if(!(s[1]||s[2]||"")||!n||this.rules.inline.punctuation.exec(n)){const n=[...s[0]].length-1;let r,i,l=n,o=0;const a="*"===s[0][0]?this.rules.inline.emStrongRDelimAst:this.rules.inline.emStrongRDelimUnd;for(a.lastIndex=0,t=t.slice(-1*e.length+n);null!=(s=a.exec(t));){if(r=s[1]||s[2]||s[3]||s[4]||s[5]||s[6],!r)continue;if(i=[...r].length,s[3]||s[4]){l+=i;continue}if((s[5]||s[6])&&n%3&&!((n+i)%3)){o+=i;continue}if(l-=i,l>0)continue;i=Math.min(i,i+l+o);const t=[...s[0]][0].length,a=e.slice(0,n+s.index+t+i);if(Math.min(n,i)%2){const e=a.slice(1,-1);return{type:"em",raw:a,text:e,tokens:this.lexer.inlineTokens(e)}}const c=a.slice(2,-2);return{type:"strong",raw:a,text:c,tokens:this.lexer.inlineTokens(c)}}}}codespan(e){const t=this.rules.inline.code.exec(e);if(t){let e=t[2].replace(this.rules.other.newLineCharGlobal," ");const n=this.rules.other.nonSpaceChar.test(e),s=this.rules.other.startingSpaceChar.test(e)&&this.rules.other.endingSpaceChar.test(e);return n&&s&&(e=e.substring(1,e.length-1)),{type:"codespan",raw:t[0],text:e}}}br(e){const t=this.rules.inline.br.exec(e);if(t)return{type:"br",raw:t[0]}}del(e){const t=this.rules.inline.del.exec(e);if(t)return{type:"del",raw:t[0],text:t[2],tokens:this.lexer.inlineTokens(t[2])}}autolink(e){const t=this.rules.inline.autolink.exec(e);if(t){let e,n;return"@"===t[2]?(e=t[1],n="mailto:"+e):(e=t[1],n=e),{type:"link",raw:t[0],text:e,href:n,tokens:[{type:"text",raw:e,text:e}]}}}url(e){let t;if(t=this.rules.inline.url.exec(e)){let e,n;if("@"===t[2])e=t[0],n="mailto:"+e;else{let s;do{s=t[0],t[0]=this.rules.inline._backpedal.exec(t[0])?.[0]??""}while(s!==t[0]);e=t[0],n="www."===t[1]?"http://"+t[0]:t[0]}return{type:"link",raw:t[0],text:e,href:n,tokens:[{type:"text",raw:e,text:e}]}}}inlineText(e){const t=this.rules.inline.text.exec(e);if(t){const e=this.lexer.state.inRawBlock;return{type:"text",raw:t[0],text:t[0],escaped:e}}}}class K{tokens;options;state;tokenizer;inlineQueue;constructor(t){this.tokens=[],this.tokens.links=Object.create(null),this.options=t||e.defaults,this.options.tokenizer=this.options.tokenizer||new J,this.tokenizer=this.options.tokenizer,this.tokenizer.options=this.options,this.tokenizer.lexer=this,this.inlineQueue=[],this.state={inLink:!1,inRawBlock:!1,top:!0};const n={other:i,block:M.normal,inline:O.normal};this.options.pedantic?(n.block=M.pedantic,n.inline=O.pedantic):this.options.gfm&&(n.block=M.gfm,this.options.breaks?n.inline=O.breaks:n.inline=O.gfm),this.tokenizer.rules=n}static get rules(){return{block:M,inline:O}}static lex(e,t){return new K(t).lex(e)}static lexInline(e,t){return new K(t).inlineTokens(e)}lex(e){e=e.replace(i.carriageReturn,"\n"),this.blockTokens(e,this.tokens);for(let e=0;e<this.inlineQueue.length;e++){const t=this.inlineQueue[e];this.inlineTokens(t.src,t.tokens)}return this.inlineQueue=[],this.tokens}blockTokens(e,t=[],n=!1){let s,r,l;for(this.options.pedantic&&(e=e.replace(i.tabCharGlobal,"    ").replace(i.spaceLine,""));e;)if(!(this.options.extensions&&this.options.extensions.block&&this.options.extensions.block.some((n=>!!(s=n.call({lexer:this},e,t))&&(e=e.substring(s.raw.length),t.push(s),!0)))))if(s=this.tokenizer.space(e))e=e.substring(s.raw.length),1===s.raw.length&&t.length>0?t[t.length-1].raw+="\n":t.push(s);else if(s=this.tokenizer.code(e))e=e.substring(s.raw.length),r=t[t.length-1],!r||"paragraph"!==r.type&&"text"!==r.type?t.push(s):(r.raw+="\n"+s.raw,r.text+="\n"+s.text,this.inlineQueue[this.inlineQueue.length-1].src=r.text);else if(s=this.tokenizer.fences(e))e=e.substring(s.raw.length),t.push(s);else if(s=this.tokenizer.heading(e))e=e.substring(s.raw.length),t.push(s);else if(s=this.tokenizer.hr(e))e=e.substring(s.raw.length),t.push(s);else if(s=this.tokenizer.blockquote(e))e=e.substring(s.raw.length),t.push(s);else if(s=this.tokenizer.list(e))e=e.substring(s.raw.length),t.push(s);else if(s=this.tokenizer.html(e))e=e.substring(s.raw.length),t.push(s);else if(s=this.tokenizer.def(e))e=e.substring(s.raw.length),r=t[t.length-1],!r||"paragraph"!==r.type&&"text"!==r.type?this.tokens.links[s.tag]||(this.tokens.links[s.tag]={href:s.href,title:s.title}):(r.raw+="\n"+s.raw,r.text+="\n"+s.raw,this.inlineQueue[this.inlineQueue.length-1].src=r.text);else if(s=this.tokenizer.table(e))e=e.substring(s.raw.length),t.push(s);else if(s=this.tokenizer.lheading(e))e=e.substring(s.raw.length),t.push(s);else{if(l=e,this.options.extensions&&this.options.extensions.startBlock){let t=1/0;const n=e.slice(1);let s;this.options.extensions.startBlock.forEach((e=>{s=e.call({lexer:this},n),"number"==typeof s&&s>=0&&(t=Math.min(t,s))})),t<1/0&&t>=0&&(l=e.substring(0,t+1))}if(this.state.top&&(s=this.tokenizer.paragraph(l)))r=t[t.length-1],n&&"paragraph"===r?.type?(r.raw+="\n"+s.raw,r.text+="\n"+s.text,this.inlineQueue.pop(),this.inlineQueue[this.inlineQueue.length-1].src=r.text):t.push(s),n=l.length!==e.length,e=e.substring(s.raw.length);else if(s=this.tokenizer.text(e))e=e.substring(s.raw.length),r=t[t.length-1],r&&"text"===r.type?(r.raw+="\n"+s.raw,r.text+="\n"+s.text,this.inlineQueue.pop(),this.inlineQueue[this.inlineQueue.length-1].src=r.text):t.push(s);else if(e){const t="Infinite loop on byte: "+e.charCodeAt(0);if(this.options.silent){console.error(t);break}throw new Error(t)}}return this.state.top=!0,t}inline(e,t=[]){return this.inlineQueue.push({src:e,tokens:t}),t}inlineTokens(e,t=[]){let n,s,r,i,l,o,a=e;if(this.tokens.links){const e=Object.keys(this.tokens.links);if(e.length>0)for(;null!=(i=this.tokenizer.rules.inline.reflinkSearch.exec(a));)e.includes(i[0].slice(i[0].lastIndexOf("[")+1,-1))&&(a=a.slice(0,i.index)+"["+"a".repeat(i[0].length-2)+"]"+a.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex))}for(;null!=(i=this.tokenizer.rules.inline.blockSkip.exec(a));)a=a.slice(0,i.index)+"["+"a".repeat(i[0].length-2)+"]"+a.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);for(;null!=(i=this.tokenizer.rules.inline.anyPunctuation.exec(a));)a=a.slice(0,i.index)+"++"+a.slice(this.tokenizer.rules.inline.anyPunctuation.lastIndex);for(;e;)if(l||(o=""),l=!1,!(this.options.extensions&&this.options.extensions.inline&&this.options.extensions.inline.some((s=>!!(n=s.call({lexer:this},e,t))&&(e=e.substring(n.raw.length),t.push(n),!0)))))if(n=this.tokenizer.escape(e))e=e.substring(n.raw.length),t.push(n);else if(n=this.tokenizer.tag(e))e=e.substring(n.raw.length),s=t[t.length-1],t.push(n);else if(n=this.tokenizer.link(e))e=e.substring(n.raw.length),t.push(n);else if(n=this.tokenizer.reflink(e,this.tokens.links))e=e.substring(n.raw.length),s=t[t.length-1],s&&"text"===n.type&&"text"===s.type?(s.raw+=n.raw,s.text+=n.text):t.push(n);else if(n=this.tokenizer.emStrong(e,a,o))e=e.substring(n.raw.length),t.push(n);else if(n=this.tokenizer.codespan(e))e=e.substring(n.raw.length),t.push(n);else if(n=this.tokenizer.br(e))e=e.substring(n.raw.length),t.push(n);else if(n=this.tokenizer.del(e))e=e.substring(n.raw.length),t.push(n);else if(n=this.tokenizer.autolink(e))e=e.substring(n.raw.length),t.push(n);else if(this.state.inLink||!(n=this.tokenizer.url(e))){if(r=e,this.options.extensions&&this.options.extensions.startInline){let t=1/0;const n=e.slice(1);let s;this.options.extensions.startInline.forEach((e=>{s=e.call({lexer:this},n),"number"==typeof s&&s>=0&&(t=Math.min(t,s))})),t<1/0&&t>=0&&(r=e.substring(0,t+1))}if(n=this.tokenizer.inlineText(r))e=e.substring(n.raw.length),"_"!==n.raw.slice(-1)&&(o=n.raw.slice(-1)),l=!0,s=t[t.length-1],s&&"text"===s.type?(s.raw+=n.raw,s.text+=n.text):t.push(n);else if(e){const t="Infinite loop on byte: "+e.charCodeAt(0);if(this.options.silent){console.error(t);break}throw new Error(t)}}else e=e.substring(n.raw.length),t.push(n);return t}}class V{options;parser;constructor(t){this.options=t||e.defaults}space(e){return""}code({text:e,lang:t,escaped:n}){const s=(t||"").match(i.notSpaceStart)?.[0],r=e.replace(i.endingNewline,"")+"\n";return s?'<pre><code class="language-'+G(s)+'">'+(n?r:G(r,!0))+"</code></pre>\n":"<pre><code>"+(n?r:G(r,!0))+"</code></pre>\n"}blockquote({tokens:e}){return`<blockquote>\n${this.parser.parse(e)}</blockquote>\n`}html({text:e}){return e}heading({tokens:e,depth:t}){return`<h${t}>${this.parser.parseInline(e)}</h${t}>\n`}hr(e){return"<hr>\n"}list(e){const t=e.ordered,n=e.start;let s="";for(let t=0;t<e.items.length;t++){const n=e.items[t];s+=this.listitem(n)}const r=t?"ol":"ul";return"<"+r+(t&&1!==n?' start="'+n+'"':"")+">\n"+s+"</"+r+">\n"}listitem(e){let t="";if(e.task){const n=this.checkbox({checked:!!e.checked});e.loose?e.tokens.length>0&&"paragraph"===e.tokens[0].type?(e.tokens[0].text=n+" "+e.tokens[0].text,e.tokens[0].tokens&&e.tokens[0].tokens.length>0&&"text"===e.tokens[0].tokens[0].type&&(e.tokens[0].tokens[0].text=n+" "+G(e.tokens[0].tokens[0].text),e.tokens[0].tokens[0].escaped=!0)):e.tokens.unshift({type:"text",raw:n+" ",text:n+" ",escaped:!0}):t+=n+" "}return t+=this.parser.parse(e.tokens,!!e.loose),`<li>${t}</li>\n`}checkbox({checked:e}){return"<input "+(e?'checked="" ':"")+'disabled="" type="checkbox">'}paragraph({tokens:e}){return`<p>${this.parser.parseInline(e)}</p>\n`}table(e){let t="",n="";for(let t=0;t<e.header.length;t++)n+=this.tablecell(e.header[t]);t+=this.tablerow({text:n});let s="";for(let t=0;t<e.rows.length;t++){const r=e.rows[t];n="";for(let e=0;e<r.length;e++)n+=this.tablecell(r[e]);s+=this.tablerow({text:n})}return s&&(s=`<tbody>${s}</tbody>`),"<table>\n<thead>\n"+t+"</thead>\n"+s+"</table>\n"}tablerow({text:e}){return`<tr>\n${e}</tr>\n`}tablecell(e){const t=this.parser.parseInline(e.tokens),n=e.header?"th":"td";return(e.align?`<${n} align="${e.align}">`:`<${n}>`)+t+`</${n}>\n`}strong({tokens:e}){return`<strong>${this.parser.parseInline(e)}</strong>`}em({tokens:e}){return`<em>${this.parser.parseInline(e)}</em>`}codespan({text:e}){return`<code>${G(e,!0)}</code>`}br(e){return"<br>"}del({tokens:e}){return`<del>${this.parser.parseInline(e)}</del>`}link({href:e,title:t,tokens:n}){const s=this.parser.parseInline(n),r=H(e);if(null===r)return s;let i='<a href="'+(e=r)+'"';return t&&(i+=' title="'+G(t)+'"'),i+=">"+s+"</a>",i}image({href:e,title:t,text:n}){const s=H(e);if(null===s)return G(n);let r=`<img src="${e=s}" alt="${n}"`;return t&&(r+=` title="${G(t)}"`),r+=">",r}text(e){return"tokens"in e&&e.tokens?this.parser.parseInline(e.tokens):"escaped"in e&&e.escaped?e.text:G(e.text)}}class W{strong({text:e}){return e}em({text:e}){return e}codespan({text:e}){return e}del({text:e}){return e}html({text:e}){return e}text({text:e}){return e}link({text:e}){return""+e}image({text:e}){return""+e}br(){return""}}class Y{options;renderer;textRenderer;constructor(t){this.options=t||e.defaults,this.options.renderer=this.options.renderer||new V,this.renderer=this.options.renderer,this.renderer.options=this.options,this.renderer.parser=this,this.textRenderer=new W}static parse(e,t){return new Y(t).parse(e)}static parseInline(e,t){return new Y(t).parseInline(e)}parse(e,t=!0){let n="";for(let s=0;s<e.length;s++){const r=e[s];if(this.options.extensions&&this.options.extensions.renderers&&this.options.extensions.renderers[r.type]){const e=r,t=this.options.extensions.renderers[e.type].call({parser:this},e);if(!1!==t||!["space","hr","heading","code","table","blockquote","list","html","paragraph","text"].includes(e.type)){n+=t||"";continue}}const i=r;switch(i.type){case"space":n+=this.renderer.space(i);continue;case"hr":n+=this.renderer.hr(i);continue;case"heading":n+=this.renderer.heading(i);continue;case"code":n+=this.renderer.code(i);continue;case"table":n+=this.renderer.table(i);continue;case"blockquote":n+=this.renderer.blockquote(i);continue;case"list":n+=this.renderer.list(i);continue;case"html":n+=this.renderer.html(i);continue;case"paragraph":n+=this.renderer.paragraph(i);continue;case"text":{let r=i,l=this.renderer.text(r);for(;s+1<e.length&&"text"===e[s+1].type;)r=e[++s],l+="\n"+this.renderer.text(r);n+=t?this.renderer.paragraph({type:"paragraph",raw:l,text:l,tokens:[{type:"text",raw:l,text:l,escaped:!0}]}):l;continue}default:{const e='Token with "'+i.type+'" type was not found.';if(this.options.silent)return console.error(e),"";throw new Error(e)}}}return n}parseInline(e,t){t=t||this.renderer;let n="";for(let s=0;s<e.length;s++){const r=e[s];if(this.options.extensions&&this.options.extensions.renderers&&this.options.extensions.renderers[r.type]){const e=this.options.extensions.renderers[r.type].call({parser:this},r);if(!1!==e||!["escape","html","link","image","strong","em","codespan","br","del","text"].includes(r.type)){n+=e||"";continue}}const i=r;switch(i.type){case"escape":case"text":n+=t.text(i);break;case"html":n+=t.html(i);break;case"link":n+=t.link(i);break;case"image":n+=t.image(i);break;case"strong":n+=t.strong(i);break;case"em":n+=t.em(i);break;case"codespan":n+=t.codespan(i);break;case"br":n+=t.br(i);break;case"del":n+=t.del(i);break;default:{const e='Token with "'+i.type+'" type was not found.';if(this.options.silent)return console.error(e),"";throw new Error(e)}}}return n}}class ee{options;block;constructor(t){this.options=t||e.defaults}static passThroughHooks=new Set(["preprocess","postprocess","processAllTokens"]);preprocess(e){return e}postprocess(e){return e}processAllTokens(e){return e}provideLexer(){return this.block?K.lex:K.lexInline}provideParser(){return this.block?Y.parse:Y.parseInline}}class te{defaults={async:!1,breaks:!1,extensions:null,gfm:!0,hooks:null,pedantic:!1,renderer:null,silent:!1,tokenizer:null,walkTokens:null};options=this.setOptions;parse=this.parseMarkdown(!0);parseInline=this.parseMarkdown(!1);Parser=Y;Renderer=V;TextRenderer=W;Lexer=K;Tokenizer=J;Hooks=ee;constructor(...e){this.use(...e)}walkTokens(e,t){let n=[];for(const s of e)switch(n=n.concat(t.call(this,s)),s.type){case"table":{const e=s;for(const s of e.header)n=n.concat(this.walkTokens(s.tokens,t));for(const s of e.rows)for(const e of s)n=n.concat(this.walkTokens(e.tokens,t));break}case"list":{const e=s;n=n.concat(this.walkTokens(e.items,t));break}default:{const e=s;this.defaults.extensions?.childTokens?.[e.type]?this.defaults.extensions.childTokens[e.type].forEach((s=>{const r=e[s].flat(1/0);n=n.concat(this.walkTokens(r,t))})):e.tokens&&(n=n.concat(this.walkTokens(e.tokens,t)))}}return n}use(...e){const t=this.defaults.extensions||{renderers:{},childTokens:{}};return e.forEach((e=>{const n={...e};if(n.async=this.defaults.async||n.async||!1,e.extensions&&(e.extensions.forEach((e=>{if(!e.name)throw new Error("extension name required");if("renderer"in e){const n=t.renderers[e.name];t.renderers[e.name]=n?function(...t){let s=e.renderer.apply(this,t);return!1===s&&(s=n.apply(this,t)),s}:e.renderer}if("tokenizer"in e){if(!e.level||"block"!==e.level&&"inline"!==e.level)throw new Error("extension level must be 'block' or 'inline'");const n=t[e.level];n?n.unshift(e.tokenizer):t[e.level]=[e.tokenizer],e.start&&("block"===e.level?t.startBlock?t.startBlock.push(e.start):t.startBlock=[e.start]:"inline"===e.level&&(t.startInline?t.startInline.push(e.start):t.startInline=[e.start]))}"childTokens"in e&&e.childTokens&&(t.childTokens[e.name]=e.childTokens)})),n.extensions=t),e.renderer){const t=this.defaults.renderer||new V(this.defaults);for(const n in e.renderer){if(!(n in t))throw new Error(`renderer '${n}' does not exist`);if(["options","parser"].includes(n))continue;const s=n,r=e.renderer[s],i=t[s];t[s]=(...e)=>{let n=r.apply(t,e);return!1===n&&(n=i.apply(t,e)),n||""}}n.renderer=t}if(e.tokenizer){const t=this.defaults.tokenizer||new J(this.defaults);for(const n in e.tokenizer){if(!(n in t))throw new Error(`tokenizer '${n}' does not exist`);if(["options","rules","lexer"].includes(n))continue;const s=n,r=e.tokenizer[s],i=t[s];t[s]=(...e)=>{let n=r.apply(t,e);return!1===n&&(n=i.apply(t,e)),n}}n.tokenizer=t}if(e.hooks){const t=this.defaults.hooks||new ee;for(const n in e.hooks){if(!(n in t))throw new Error(`hook '${n}' does not exist`);if(["options","block"].includes(n))continue;const s=n,r=e.hooks[s],i=t[s];ee.passThroughHooks.has(n)?t[s]=e=>{if(this.defaults.async)return Promise.resolve(r.call(t,e)).then((e=>i.call(t,e)));const n=r.call(t,e);return i.call(t,n)}:t[s]=(...e)=>{let n=r.apply(t,e);return!1===n&&(n=i.apply(t,e)),n}}n.hooks=t}if(e.walkTokens){const t=this.defaults.walkTokens,s=e.walkTokens;n.walkTokens=function(e){let n=[];return n.push(s.call(this,e)),t&&(n=n.concat(t.call(this,e))),n}}this.defaults={...this.defaults,...n}})),this}setOptions(e){return this.defaults={...this.defaults,...e},this}lexer(e,t){return K.lex(e,t??this.defaults)}parser(e,t){return Y.parse(e,t??this.defaults)}parseMarkdown(e){return(t,n)=>{const s={...n},r={...this.defaults,...s},i=this.onError(!!r.silent,!!r.async);if(!0===this.defaults.async&&!1===s.async)return i(new Error("marked(): The async option was set to true by an extension. Remove async: false from the parse options object to return a Promise."));if(null==t)return i(new Error("marked(): input parameter is undefined or null"));if("string"!=typeof t)return i(new Error("marked(): input parameter is of type "+Object.prototype.toString.call(t)+", string expected"));r.hooks&&(r.hooks.options=r,r.hooks.block=e);const l=r.hooks?r.hooks.provideLexer():e?K.lex:K.lexInline,o=r.hooks?r.hooks.provideParser():e?Y.parse:Y.parseInline;if(r.async)return Promise.resolve(r.hooks?r.hooks.preprocess(t):t).then((e=>l(e,r))).then((e=>r.hooks?r.hooks.processAllTokens(e):e)).then((e=>r.walkTokens?Promise.all(this.walkTokens(e,r.walkTokens)).then((()=>e)):e)).then((e=>o(e,r))).then((e=>r.hooks?r.hooks.postprocess(e):e)).catch(i);try{r.hooks&&(t=r.hooks.preprocess(t));let e=l(t,r);r.hooks&&(e=r.hooks.processAllTokens(e)),r.walkTokens&&this.walkTokens(e,r.walkTokens);let n=o(e,r);return r.hooks&&(n=r.hooks.postprocess(n)),n}catch(e){return i(e)}}}onError(e,t){return n=>{if(n.message+="\nPlease report this to https://github.com/markedjs/marked.",e){const e="<p>An error occurred:</p><pre>"+G(n.message+"",!0)+"</pre>";return t?Promise.resolve(e):e}if(t)return Promise.reject(n);throw n}}}const ne=new te;function se(e,t){return ne.parse(e,t)}se.options=se.setOptions=function(e){return ne.setOptions(e),se.defaults=ne.defaults,n(se.defaults),se},se.getDefaults=t,se.defaults=e.defaults,se.use=function(...e){return ne.use(...e),se.defaults=ne.defaults,n(se.defaults),se},se.walkTokens=function(e,t){return ne.walkTokens(e,t)},se.parseInline=ne.parseInline,se.Parser=Y,se.parser=Y.parse,se.Renderer=V,se.TextRenderer=W,se.Lexer=K,se.lexer=K.lex,se.Tokenizer=J,se.Hooks=ee,se.parse=se;const re=se.options,ie=se.setOptions,le=se.use,oe=se.walkTokens,ae=se.parseInline,ce=se,he=Y.parse,pe=K.lex;e.Hooks=ee,e.Lexer=K,e.Marked=te,e.Parser=Y,e.Renderer=V,e.TextRenderer=W,e.Tokenizer=J,e.getDefaults=t,e.lexer=pe,e.marked=se,e.options=re,e.parse=ce,e.parseInline=ae,e.parser=he,e.setOptions=ie,e.use=le,e.walkTokens=oe}));
//# sourceMappingURL=/sm/578785afb9d81fb931cd06178baa519a89ea95498ebe18cda939aaf8214fa063.map
;(function(){
/**
 * Constants - 全局几何与导出参数
 */

// 预览画布的基础尺寸 (3:4 比例)
const PREVIEW_WIDTH = 500;
const PREVIEW_HEIGHT = 667;

// 输出图片的高清尺寸 (等比放大)
const OUTPUT_WIDTH = 1242;
const OUTPUT_HEIGHT = 1656;

// 默认文案
const DEFAULT_BRAND_TEXT = '极客狐';
const DEFAULT_WATERMARK_OPACITY = 0.1;
const DEFAULT_DEBOUNCE_DELAY = 300;
const DEFAULT_COVER_IMAGE = 'assets/default-cover.jpg';

/**
 * MarkdownParser - Markdown 解析工具
 */
class MarkdownParser {
    static init() {
        if (typeof marked === 'undefined' || this.isInitialized) return;

        // 添加 ==高亮== 自定义语法
        const highlightExtension = {
            name: 'highlight',
            level: 'inline',
            start(src) { return src.indexOf('=='); },
            tokenizer(src) {
                const rule = /^==([^=]+)==/;
                const match = rule.exec(src);
                if (match) {
                    return {
                        type: 'highlight',
                        raw: match[0],
                        text: match[1],
                        tokens: this.lexer.inlineTokens(match[1])
                    };
                }
            },
            renderer(token) { return `<mark class="highlight">${token.text}</mark>`; }
        };

        // 添加 ::: center ... ::: 块级居中语法
        const centerBlockExtension = {
            name: 'centerBlock',
            level: 'block',
            start(src) {
                const match = src.match(/^[ \t]*:::[ \t]*center/m);
                return match ? match.index : undefined;
            },
            tokenizer(src) {
                // 支持多行块级语法：::: center\n内容\n:::
                const rule = /^[ \t]*:::[ \t]*center[ \t]*\n([\s\S]+?)\n[ \t]*:::[ \t]*(?:\n|$)/;
                const match = rule.exec(src);
                if (!match) return;

                const text = match[1].trim();
                if (!text) return;

                // 使用 blockTokens 解析内部内容，支持段落、加粗、高亮等所有 Markdown 语法
                const childTokens = [];
                this.lexer.blockTokens(text, childTokens);

                return {
                    type: 'centerBlock',
                    raw: match[0],
                    text: text,
                    tokens: childTokens
                };
            },
            renderer(token) {
                return `<div style="text-align:center;">${this.parser.parse(token.tokens)}</div>`;
            }
        };

        const mathBlockExtension = {
            name: 'mathBlock',
            level: 'block',
            start(src) {
                const dollarMatch = src.match(/^[ \t]*\$\$/m);
                const bracketMatch = src.match(/^[ \t]*\\\[/m);
                if (!dollarMatch) return bracketMatch ? bracketMatch.index : undefined;
                if (!bracketMatch) return dollarMatch.index;
                return Math.min(dollarMatch.index, bracketMatch.index);
            },
            tokenizer(src) {
                const dollarRule = /^[ \t]*\$\$[ \t]*\n?([\s\S]+?)\n?[ \t]*\$\$[ \t]*(?:\n|$)/;
                const bracketRule = /^[ \t]*\\\[[ \t]*\n?([\s\S]+?)\n?[ \t]*\\\][ \t]*(?:\n|$)/;
                const match = dollarRule.exec(src) || bracketRule.exec(src);
                if (!match) return;
                return {
                    type: 'mathBlock',
                    raw: match[0],
                    text: match[1].trim(),
                    display: true
                };
            },
            renderer(token) {
                return `<div class="math-block">${token.text}</div>`;
            }
        };

        const inlineMathExtension = {
            name: 'inlineMath',
            level: 'inline',
            start(src) {
                const dollarIndex = src.indexOf('$');
                const parenIndex = src.indexOf('\\(');
                if (dollarIndex === -1) return parenIndex === -1 ? undefined : parenIndex;
                if (parenIndex === -1) return dollarIndex;
                return Math.min(dollarIndex, parenIndex);
            },
            tokenizer(src) {
                const dollarRule = /^\$((?:\\.|[^$\n])+?)\$(?!\$)/;
                const parenRule = /^\\\(((?:\\.|[\s\S])+?)\\\)/;
                const match = dollarRule.exec(src) || parenRule.exec(src);
                if (!match) return;
                return {
                    type: 'inlineMath',
                    raw: match[0],
                    text: match[1].trim(),
                    display: false
                };
            },
            renderer(token) {
                return `<span class="math-inline">${token.text}</span>`;
            }
        };

        marked.use({ extensions: [mathBlockExtension, inlineMathExtension, highlightExtension, centerBlockExtension] });
        marked.setOptions({ breaks: true, gfm: true });
        this.isInitialized = true;
    }

    static parse(text) {
        if (typeof marked === 'undefined') return text.replace(/\n/g, '<br>');
        if (!this.isInitialized) this.init();
        return marked.parse(text);
    }
}

/**
 * CanvasTextEngine - 帆布排版引擎
 *
 * 设计原则：
 * 1. 最小单位测量：基于单个字符的测量进行精确换行，确保排版在不同字体下的稳定性。
 * 2. 语义化布局：将 Markdown Token 转换为具有层级关系的 Layout Blocks。
 * 3. 跨页能力：支持对 Layout Blocks 进行高度检测与逻辑切分，为 TextSplitter 提供拆分依据。
 * 4. 富文本渲染：支持内联样式的组合（加粗、斜体、高亮、代码、标题级别）。
 */
class CanvasTextEngine {
    constructor(config = {}) {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.widthCache = new Map(); // 字符宽度缓存
        this.mathJaxReadyPromise = null;
        this.highlightReadyPromise = null;
        this.mermaidReadyPromise = null;
        this.updateConfig(config);
    }

    /**
     * 更新全局排版参数
     */
    updateConfig(config) {
        const defaultFont = "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans SC', sans-serif";
        const oldConfig = this.config || {};
        this.config = {
            fontSize: 16, lineHeight: 1.6, letterSpacing: 0,
            fontFamily: defaultFont, textPadding: 35, cardWidth: PREVIEW_WIDTH || 500,
            ...config
        };

        if (this.config.fontFamily === 'inherit' || !this.config.fontFamily) {
            this.config.fontFamily = defaultFont;
        }

        // 如果字体或基本参数变了，清空缓存
        if (oldConfig.fontFamily !== this.config.fontFamily ||
            oldConfig.fontSize !== this.config.fontSize ||
            oldConfig.letterSpacing !== this.config.letterSpacing) {
            this.widthCache.clear();
        }

        this.drawWidth = config.drawWidth || (this.config.cardWidth - (parseFloat(this.config.textPadding) * 2 || 70));
    }

    setFont(options = {}) {
        const { fontSize = this.config.fontSize, fontWeight = 'normal', fontStyle = 'normal', fontFamily = this.config.fontFamily } = options;
        this.ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
        return this.ctx.font;
    }

    measureTextWidth(text, fontSize = this.config.fontSize, fontWeight = 'normal', fontStyle = 'normal', fontFamily = this.config.fontFamily) {
        if (!text) return 0;

        // 生成缓存键
        const cacheKey = `${text}_${fontSize}_${fontWeight}_${fontStyle}_${fontFamily}`;
        if (this.widthCache.has(cacheKey)) {
            return this.widthCache.get(cacheKey);
        }

        this.setFont({ fontSize, fontWeight, fontStyle, fontFamily });
        const letterSpacing = parseFloat(this.config.letterSpacing) || 0;
        const width = CanvasUtils.measureTextWidth(this.ctx, text, letterSpacing);

        // 只有短文本才缓存，防止缓存无限增长
        if (text.length < 10) {
            this.widthCache.set(cacheKey, width);
        }

        return width;
    }

    getCodeFontFamily() {
        return "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace";
    }

    getCodeColor(scope, fallback = '#24292f') {
        const palette = {
            keyword: '#cf222e',
            built_in: '#8250df',
            type: '#8250df',
            literal: '#0550ae',
            number: '#0550ae',
            string: '#0a7f3f',
            regexp: '#116329',
            title: '#953800',
            function: '#953800',
            params: '#24292f',
            comment: '#6e7781',
            meta: '#57606a',
            attr: '#0550ae',
            attribute: '#0550ae',
            variable: '#953800',
            symbol: '#0550ae',
            tag: '#116329',
            name: '#116329'
        };
        if (!scope) return fallback;
        const parts = String(scope).split(/\s+/).map(part => part.replace(/^hljs-/, ''));
        for (const part of parts) {
            if (palette[part]) return palette[part];
        }
        return fallback;
    }

    tokenizePythonCode(code) {
        const colors = {
            keyword: '#cf222e',
            builtIn: '#8250df',
            string: '#0a7f3f',
            number: '#0550ae',
            comment: '#6e7781',
            function: '#953800',
            text: '#24292f'
        };
        const keywordPattern = 'False|None|True|and|as|assert|async|await|break|class|continue|def|del|elif|else|except|finally|for|from|global|if|import|in|is|lambda|nonlocal|not|or|pass|raise|return|try|while|with|yield';
        const builtInPattern = 'abs|all|any|bool|dict|enumerate|float|int|len|list|map|max|min|print|range|set|str|sum|tuple|zip';
        const tokenRule = new RegExp(
            `(#.*)|(\"\"\"[\\\\s\\\\S]*?\"\"\"|'''[\\\\s\\\\S]*?'''|\"(?:\\\\\\\\.|[^\"\\\\\\\\])*\"|'(?:\\\\\\\\.|[^'\\\\\\\\])*')|\\b(\\d+(?:\\.\\d+)?)\\b|\\b(${keywordPattern})\\b|\\b(${builtInPattern})\\b|\\b([A-Za-z_]\\w*)(?=\\s*\\()`,
            'g'
        );

        const segments = [];
        let lastIndex = 0;
        let match;
        while ((match = tokenRule.exec(code)) !== null) {
            if (match.index > lastIndex) {
                segments.push({ text: code.slice(lastIndex, match.index), color: colors.text });
            }
            const color = match[1] ? colors.comment
                : match[2] ? colors.string
                : match[3] ? colors.number
                : match[4] ? colors.keyword
                : match[5] ? colors.builtIn
                : match[6] ? colors.function
                : colors.text;
            segments.push({ text: match[0], color });
            lastIndex = tokenRule.lastIndex;
        }
        if (lastIndex < code.length) {
            segments.push({ text: code.slice(lastIndex), color: colors.text });
        }
        return segments;
    }

    highlightCode(code, lang) {
        if (typeof hljs === 'undefined') {
            if (String(lang || '').toLowerCase() === 'python' || String(lang || '').toLowerCase() === 'py') {
                return this.tokenizePythonCode(code);
            }
            return [{ text: code, color: '#24292f' }];
        }

        let highlighted;
        try {
            if (lang && hljs.getLanguage && hljs.getLanguage(lang)) {
                highlighted = hljs.highlight(code, { language: lang, ignoreIllegals: true }).value;
            } else {
                highlighted = hljs.highlightAuto(code).value;
            }
        } catch (e) {
            return [{ text: code, color: '#24292f' }];
        }

        const host = document.createElement('div');
        host.innerHTML = highlighted;
        const segments = [];
        const walk = (node, scope = '') => {
            if (node.nodeType === Node.TEXT_NODE) {
                if (node.nodeValue) segments.push({ text: node.nodeValue, color: this.getCodeColor(scope) });
                return;
            }
            if (node.nodeType !== Node.ELEMENT_NODE) return;
            const nextScope = `${scope} ${node.className || ''}`.trim();
            node.childNodes.forEach(child => walk(child, nextScope));
        };
        host.childNodes.forEach(node => walk(node));
        return segments.length ? segments : [{ text: code, color: '#24292f' }];
    }

    splitCodeSegments(segments, maxWidth) {
        const fontSize = this.config.fontSize * 0.82;
        const fontFamily = this.getCodeFontFamily();
        const lines = [];
        let currentLine = [];
        let currentWidth = 0;

        const pushLine = () => {
            lines.push(currentLine.length ? currentLine : [{ text: '', fontSize, fontFamily, isCode: true, color: '#24292f' }]);
            currentLine = [];
            currentWidth = 0;
        };

        for (const segment of segments) {
            for (const char of Array.from(segment.text || '')) {
                if (char === '\n') {
                    pushLine();
                    continue;
                }

                const charWidth = this.measureTextWidth(char, fontSize, 'normal', 'normal', fontFamily);
                if (currentWidth + charWidth > maxWidth && currentLine.length > 0) {
                    pushLine();
                }

                const last = currentLine[currentLine.length - 1];
                if (last && last.color === segment.color) {
                    last.text += char;
                } else {
                    currentLine.push({
                        text: char,
                        fontSize,
                        fontFamily,
                        isCode: true,
                        isCodeBlock: true,
                        color: segment.color || '#24292f'
                    });
                }
                currentWidth += charWidth;
            }
        }

        if (currentLine.length > 0 || lines.length === 0) pushLine();
        return lines;
    }

    async waitForMathJax(timeoutMs = 5000) {
        if (!this.mathJaxReadyPromise) {
            this.mathJaxReadyPromise = (async () => {
                const started = Date.now();
                while (Date.now() - started < timeoutMs) {
                    if (typeof MathJax !== 'undefined' && MathJax.tex2svgPromise) return true;
                    await new Promise(resolve => setTimeout(resolve, 50));
                }
                return false;
            })();
        }
        return this.mathJaxReadyPromise;
    }

    async waitForHighlightJs(timeoutMs = 3000) {
        if (!this.highlightReadyPromise) {
            this.highlightReadyPromise = (async () => {
                const started = Date.now();
                while (Date.now() - started < timeoutMs) {
                    if (typeof hljs !== 'undefined') return true;
                    await new Promise(resolve => setTimeout(resolve, 50));
                }
                return false;
            })();
        }
        return this.highlightReadyPromise;
    }

    async waitForMermaid(timeoutMs = 5000) {
        if (!this.mermaidReadyPromise) {
            this.mermaidReadyPromise = (async () => {
                if (window.mermaid) return window.mermaid;

                try {
                    if (window.mermaidReady) {
                        return await Promise.race([
                            window.mermaidReady,
                            new Promise((_, reject) => setTimeout(() => reject(new Error('Mermaid load timeout')), timeoutMs))
                        ]);
                    }
                } catch (e) {
                    console.warn('[CanvasTextEngine] Mermaid initialization failed:', e);
                }

                const started = Date.now();
                while (Date.now() - started < timeoutMs) {
                    if (window.mermaid) return window.mermaid;
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                return null;
            })();
        }
        return this.mermaidReadyPromise;
    }

    async renderMath(text, display = false, fontSize = this.config.fontSize) {
        if (!text) return null;
        const hasMathJax = await this.waitForMathJax();
        if (!hasMathJax) {
            return {
                text: display ? `$$${text}$$` : `$${text}$`,
                fontSize,
                isCode: true,
                mathFallback: true
            };
        }

        try {
            if (MathJax.startup && MathJax.startup.promise) {
                await MathJax.startup.promise;
            }

            const node = await MathJax.tex2svgPromise(text, { display });
            const svg = node.querySelector('svg');
            if (!svg) return null;

            svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
            svg.style.color = this.config.textColor || '#111111';

            const host = document.createElement('div');
            host.style.position = 'absolute';
            host.style.left = '-10000px';
            host.style.top = '-10000px';
            host.style.fontSize = `${fontSize}px`;
            host.style.visibility = 'hidden';
            host.appendChild(svg.cloneNode(true));
            document.body.appendChild(host);
            const measuredSvg = host.querySelector('svg');
            const rect = measuredSvg.getBoundingClientRect();
            document.body.removeChild(host);

            const width = Math.max(1, rect.width || fontSize * text.length * 0.5);
            const height = Math.max(fontSize * 1.2, rect.height || fontSize * 1.4);
            svg.setAttribute('width', width);
            svg.setAttribute('height', height);

            const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(svg))}`;
            const image = await new Promise((resolve) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = () => resolve(null);
                img.src = dataUrl;
            });
            if (!image) return null;
            return { image, width, height, text, fontSize, isMath: true, display };
        } catch (e) {
            console.warn('[CanvasTextEngine] Math render failed:', e);
            return {
                text: display ? `$$${text}$$` : `$${text}$`,
                fontSize,
                isCode: true,
                mathFallback: true
            };
        }
    }

    isColorLight(colorStr) {
        if (!colorStr) return false;
        colorStr = colorStr.trim().toLowerCase();
        if (colorStr.startsWith('#')) {
            const hex = colorStr.substring(1);
            if (hex.length === 3) {
                const r = parseInt(hex[0] + hex[0], 16);
                const g = parseInt(hex[1] + hex[1], 16);
                const b = parseInt(hex[2] + hex[2], 16);
                return (r * 0.299 + g * 0.587 + b * 0.114) > 186;
            } else if (hex.length === 6) {
                const r = parseInt(hex.substring(0, 2), 16);
                const g = parseInt(hex.substring(2, 4), 16);
                const b = parseInt(hex.substring(4, 6), 16);
                return (r * 0.299 + g * 0.587 + b * 0.114) > 186;
            }
        } else if (colorStr.startsWith('rgb')) {
            const match = colorStr.match(/\d+/g);
            if (match && match.length >= 3) {
                const r = parseInt(match[0]);
                const g = parseInt(match[1]);
                const b = parseInt(match[2]);
                return (r * 0.299 + g * 0.587 + b * 0.114) > 186;
            }
        }
        return false;
    }

    getSvgDimensions(svgElement) {
        if (!svgElement) return { width: 400, height: 300 };
        const viewBox = svgElement.viewBox && svgElement.viewBox.baseVal;
        if (viewBox && viewBox.width > 0 && viewBox.height > 0) {
            return { width: viewBox.width, height: viewBox.height };
        }

        const width = parseFloat(svgElement.getAttribute('width'));
        const height = parseFloat(svgElement.getAttribute('height'));
        return {
            width: Number.isFinite(width) && width > 0 ? width : 400,
            height: Number.isFinite(height) && height > 0 ? height : 300
        };
    }

    createRenderErrorLayout(message) {
        const marginBottom = this.config.fontSize * 0.8;
        return {
            type: 'render-error',
            message,
            height: this.config.fontSize * 3.2 + marginBottom,
            marginTop: 0,
            marginBottom
        };
    }

    async loadSvgImage(svgText) {
        const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
        const objectUrl = URL.createObjectURL(blob);
        try {
            return await new Promise((resolve) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = () => resolve(null);
                img.src = objectUrl;
            });
        } finally {
            URL.revokeObjectURL(objectUrl);
        }
    }

    async renderMermaid(text, maxHeight = this.config.maxBlockHeight || Infinity) {
        if (!text) return this.createRenderErrorLayout('Mermaid 图表内容为空');
        const mermaidApi = await this.waitForMermaid();
        if (!mermaidApi) {
            console.warn('[CanvasTextEngine] Mermaid library is not loaded.');
            return this.createRenderErrorLayout('Mermaid 图表加载失败');
        }

        try {
            const id = 'mermaid-' + Math.random().toString(36).substring(2, 9);
            const isLightText = this.isColorLight(this.config.textColor || '#111111');
            const theme = isLightText ? 'dark' : 'neutral';

            let diagramText = text;
            if (!text.trim().startsWith('%%{init')) {
                diagramText = `%%{init: {'theme': '${theme}', 'flowchart': {'htmlLabels': false}}}%%\n` + text;
            }

            const { svg: svgHtml } = await mermaidApi.render(id, diagramText);
            if (!svgHtml) return this.createRenderErrorLayout('Mermaid 图表生成失败');

            const documentNode = new DOMParser().parseFromString(svgHtml, 'image/svg+xml');
            const svgElement = documentNode.documentElement;
            if (!svgElement || svgElement.nodeName.toLowerCase() !== 'svg') {
                return this.createRenderErrorLayout('Mermaid 图表生成失败');
            }
            const { width, height } = this.getSvgDimensions(svgElement);
            svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
            svgElement.setAttribute('width', String(width));
            svgElement.setAttribute('height', String(height));
            svgElement.style.removeProperty('max-width');
            const serializedSvg = new XMLSerializer().serializeToString(svgElement);
            const image = await this.loadSvgImage(serializedSvg);

            if (!image) return this.createRenderErrorLayout('Mermaid 图表载入失败');

            const maxWidth = this.drawWidth;
            const safeMaxHeight = Number.isFinite(maxHeight) ? Math.max(1, maxHeight - 20) : Infinity;
            const scale = Math.min(1, maxWidth / width, safeMaxHeight / height);
            const finalWidth = width * scale;
            const contentHeight = height * scale;
            const paddingY = 10;
            const marginBottom = this.config.fontSize * 0.8;

            return {
                type: 'mermaid-block',
                image,
                width: finalWidth,
                contentHeight,
                height: contentHeight + (paddingY * 2) + marginBottom,
                paddingY,
                marginTop: 0,
                marginBottom
            };
        } catch (e) {
            console.error('[CanvasTextEngine] Mermaid rendering failed:', e);
            return this.createRenderErrorLayout('Mermaid 图表解析失败');
        }
    }

    async layoutTable(token) {
        if (!token) return null;
        const C = token.header.length;
        const colLengths = new Array(C).fill(0);
        for (let c = 0; c < C; c++) {
            colLengths[c] = Math.max(colLengths[c], token.header[c].text.length);
        }
        for (let r = 0; r < token.rows.length; r++) {
            const row = token.rows[r];
            for (let c = 0; c < C; c++) {
                if (row[c]) {
                    colLengths[c] = Math.max(colLengths[c], row[c].text.length);
                }
            }
        }

        const totalLen = colLengths.reduce((a, b) => a + b, 0) || 1;
        const colWidths = [];
        let allocatedWidth = 0;
        for (let c = 0; c < C; c++) {
            let w = Math.round((colLengths[c] / totalLen) * this.drawWidth);
            w = Math.max(60, w);
            colWidths.push(w);
            allocatedWidth += w;
        }

        const scale = this.drawWidth / allocatedWidth;
        for (let c = 0; c < C; c++) {
            colWidths[c] = Math.floor(colWidths[c] * scale);
        }
        const currentSum = colWidths.reduce((a, b) => a + b, 0);
        colWidths[C - 1] += (this.drawWidth - currentSum);

        const cellPaddingX = 8;
        const cellPaddingY = 8;
        const baseLineHeight = this.config.fontSize * (parseFloat(this.config.lineHeight) || 1.6);

        const rowsLayout = [];
        let totalTableHeight = 0;

        const headerRowCells = [];
        let headerRowHeight = 0;
        for (let c = 0; c < C; c++) {
            const cell = token.header[c];
            const cellWidth = colWidths[c];
            const lines = await this.layoutInlineText(
                cell.tokens || [{ type: 'text', text: cell.text }],
                cellWidth - (cellPaddingX * 2),
                { fontWeight: '700' }
            );
            const cellHeight = (lines.length * baseLineHeight) + (cellPaddingY * 2);
            headerRowHeight = Math.max(headerRowHeight, cellHeight);
            headerRowCells.push({
                lines,
                width: cellWidth,
                align: token.align[c] || 'left',
                isHeader: true
            });
        }
        rowsLayout.push({ cells: headerRowCells, height: headerRowHeight, isHeaderRow: true });
        totalTableHeight += headerRowHeight;

        for (let r = 0; r < token.rows.length; r++) {
            const row = token.rows[r];
            const dataRowCells = [];
            let dataRowHeight = 0;
            for (let c = 0; c < C; c++) {
                const cell = row[c] || { text: '' };
                const cellWidth = colWidths[c];
                const lines = await this.layoutInlineText(cell.tokens || [{ type: 'text', text: cell.text }], cellWidth - (cellPaddingX * 2));
                const cellHeight = (lines.length * baseLineHeight) + (cellPaddingY * 2);
                dataRowHeight = Math.max(dataRowHeight, cellHeight);
                dataRowCells.push({
                    lines,
                    width: cellWidth,
                    align: token.align[c] || 'left',
                    isHeader: false
                });
            }
            rowsLayout.push({ cells: dataRowCells, height: dataRowHeight, isHeaderRow: false });
            totalTableHeight += dataRowHeight;
        }

        const marginBottom = this.config.fontSize * 0.8;
        return {
            type: 'table-grid',
            rows: rowsLayout,
            colWidths,
            height: totalTableHeight + marginBottom,
            cellPaddingX,
            cellPaddingY,
            marginTop: 0,
            marginBottom
        };
    }

    createTablePart(layout, rows, includeMarginBottom) {
        const marginBottom = includeMarginBottom ? (layout.marginBottom || 0) : 0;
        return {
            ...layout,
            rows,
            height: rows.reduce((sum, row) => sum + row.height, 0) + marginBottom,
            marginBottom
        };
    }

    splitTableLayout(layout, availableHeight) {
        if (!layout || layout.type !== 'table-grid' || !layout.rows || layout.rows.length < 3) return null;
        const header = layout.rows[0];
        let usedHeight = header.height;
        let splitIndex = 1;

        while (splitIndex < layout.rows.length && usedHeight + layout.rows[splitIndex].height <= availableHeight) {
            usedHeight += layout.rows[splitIndex].height;
            splitIndex += 1;
        }

        if (splitIndex <= 1) {
            return { part1: null, part2: layout };
        }
        if (splitIndex >= layout.rows.length) return null;

        return {
            part1: this.createTablePart(layout, layout.rows.slice(0, splitIndex), false),
            part2: this.createTablePart(layout, [header, ...layout.rows.slice(splitIndex)], true)
        };
    }

    /**
     * 测量图片尺寸并计算缩放后的高度
     */
    async measureImage(src, maxWidth = this.drawWidth) {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';

            const timeout = setTimeout(() => {
                img.onload = null;
                img.onerror = null;
                resolve({ width: maxWidth, height: 100, error: true, timeout: true });
            }, 5000);

            img.onload = () => {
                clearTimeout(timeout);
                const ratio = img.height / img.width;
                const height = maxWidth * ratio;
                resolve({ width: maxWidth, height, ratio, originalWidth: img.width, originalHeight: img.height });
            };
            img.onerror = () => {
                clearTimeout(timeout);
                resolve({ width: maxWidth, height: 100, error: true });
            };
            img.src = src;
        });
    }

    /**
     * 将原始文本拆分为行（用于简单文本或代码块）
     */
    splitIntoLines(text, style = {}, maxWidth = this.drawWidth) {
        const { fontSize = this.config.fontSize, fontWeight = 'normal' } = style;
        const lines = [];
        let currentLine = '', currentWidth = 0;

        if (!text) return [];

        for (const char of text) {
            if (char === '\n') {
                lines.push(currentLine);
                currentLine = ''; currentWidth = 0;
                continue;
            }

            const charWidth = this.measureTextWidth(char, fontSize, fontWeight);
            if (currentWidth + charWidth > maxWidth && currentLine !== '') {
                lines.push(currentLine);
                currentLine = char; currentWidth = charWidth;
            } else {
                currentLine += char; currentWidth += charWidth;
            }
        }
        if (currentLine !== '') lines.push(currentLine);
        return lines;
    }

    /**
     * 将解析后的 Token 转换为布局对象
     */
    async layoutToken(token) {
        const layouts = [];
        const baseLineHeight = this.config.fontSize * this.config.lineHeight;

        if (!token) return layouts;

        switch (token.type) {
            case 'centerBlock': {
                // 内部 tokens 是块级 token（paragraph, heading 等），逐个布局并标记居中
                const childTokens = token.tokens || [];
                for (const child of childTokens) {
                    const childLayouts = await this.layoutToken(child);
                    for (const layout of childLayouts) {
                        layout.align = 'center';
                        layouts.push(layout);
                    }
                }
                break;
            }
            case 'image': {
                const imgData = await this.measureImage(token.href);
                const marginTop = 10, marginBottom = 20;
                layouts.push({
                    type: 'image',
                    src: token.href,
                    alt: token.text || '',
                    width: imgData.width,
                    height: (imgData.height || 100) + marginTop + marginBottom,
                    contentHeight: imgData.height || 100,
                    marginTop,
                    marginBottom
                });
                break;
            }
            case 'mathBlock': {
                const fontSize = this.config.fontSize * 0.9;
                const math = await this.renderMath(token.text, true, fontSize);
                if (math && math.image) {
                    const maxWidth = this.drawWidth;
                    const scale = math.width > maxWidth ? maxWidth / math.width : 1;
                    const width = math.width * scale;
                    const contentHeight = math.height * scale;
                    const marginTop = 0;
                    const marginBottom = this.config.fontSize * 0.8;
                    layouts.push({
                        type: 'math-block',
                        image: math.image,
                        width,
                        contentHeight,
                        height: contentHeight + marginTop + marginBottom,
                        marginTop,
                        marginBottom,
                        align: 'center'
                    });
                } else {
                    const lines = this.splitIntoLines(math ? math.text : token.text);
                    const marginBottom = this.config.fontSize * 0.8;
                    layouts.push({
                        type: 'code-block',
                        lines: lines.map(text => ({ text, fontSize: this.config.fontSize * 0.9, isCode: true })),
                        height: (lines.length * baseLineHeight) + marginBottom,
                        marginTop: 0,
                        marginBottom
                    });
                }
                break;
            }
            case 'heading': {
                const scales = { 1: this.config.h1Scale || 1.6, 2: this.config.h2Scale || 1.4, 3: this.config.h3Scale || 1.2 };
                const fontSize = this.config.fontSize * (scales[token.depth] || 1.1);
                const lines = await this.layoutInlineText(token.tokens || [{ type: 'text', text: token.text }], this.drawWidth, {
                    fontSize, fontWeight: '800', headingLevel: token.depth
                });

                const marginTop = fontSize * 0.6, marginBottom = fontSize * 0.4;
                layouts.push({
                    type: 'heading', depth: token.depth, lines,
                    height: marginTop + (lines.length * fontSize * this.config.lineHeight) + marginBottom,
                    marginTop, marginBottom
                });
                break;
            }
            case 'hr': {
                layouts.push({ type: 'divider', height: 20 });
                break;
            }
            case 'text':
            case 'paragraph': {
                // 如果是纯文本 token 且包含图片语法但没有被解析为 tokens（防御性处理）
                if (token.type === 'text' && !token.tokens && token.text.includes('![')) {
                    // 这里可以尝试手动解析，但通常 marked.lexer 应该能处理好
                }

                // 如果段落只包含一个图片，则直接作为图片处理
                if (token.tokens && token.tokens.length === 1 && token.tokens[0].type === 'image') {
                    return await this.layoutToken(token.tokens[0]);
                }

                // 如果段落包含多个图片和其他文本，提取出来作为独立块
                const hasImage = token.tokens && token.tokens.some(t => t.type === 'image');
                if (hasImage) {
                    const subLayouts = [];
                    let currentTextTokens = [];

                    for (const subToken of token.tokens) {
                        if (subToken.type === 'image') {
                            if (currentTextTokens.length > 0) {
                                subLayouts.push(...await this.layoutToken({ type: 'paragraph', tokens: currentTextTokens, text: '' }));
                                currentTextTokens = [];
                            }
                            subLayouts.push(...await this.layoutToken(subToken));
                        } else {
                            currentTextTokens.push(subToken);
                        }
                    }

                    if (currentTextTokens.length > 0) {
                        subLayouts.push(...await this.layoutToken({ type: 'paragraph', tokens: currentTextTokens, text: '' }));
                    }
                    return subLayouts;
                }

                const lines = await this.layoutInlineText(token.tokens || [{ type: 'text', text: token.text || '' }]);
                const marginBottom = this.config.fontSize * 0.8;
                layouts.push({
                    type: 'paragraph', lines, height: (lines.length * baseLineHeight) + marginBottom,
                    marginTop: 0, marginBottom
                });
                break;
            }
            case 'blockquote': {
                const indent = 20;
                const lines = await this.layoutInlineText(token.tokens || [{ type: 'text', text: token.text }], this.drawWidth - indent);
                const marginBottom = this.config.fontSize * 0.8;
                layouts.push({
                    type: 'blockquote', lines, indent, height: (lines.length * baseLineHeight) + marginBottom,
                    marginTop: 0, marginBottom
                });
                break;
            }
            case 'list': {
                for (let i = 0; i < token.items.length; i++) {
                    const item = token.items[i];
                    const prefix = token.ordered ? `${i + 1}. ` : '• ';
                    const prefixWidth = this.measureTextWidth(prefix);
                    let inlineTokens = item.tokens || [];
                    if (inlineTokens.length === 1 && inlineTokens[0].type === 'paragraph') {
                        inlineTokens = inlineTokens[0].tokens || [];
                    }

                    // 检查列表项中是否有图片
                    const hasImage = inlineTokens.some(t => t.type === 'image');
                    if (hasImage) {
                        // 如果有图片，我们暂时简单的把图片作为独立块处理（虽然在列表中可能排版略怪）
                        // 或者递归处理
                    }

                    const lines = await this.layoutInlineText(inlineTokens, this.drawWidth - prefixWidth);
                    const marginBottom = this.config.fontSize * 0.8;
                    layouts.push({
                        type: 'list-item', prefix, prefixWidth, lines,
                        height: (lines.length * baseLineHeight) + marginBottom,
                        marginTop: 0, marginBottom
                    });
                }
                break;
            }
            case 'space': {
                layouts.push({ type: 'space', height: this.config.fontSize });
                break;
            }
            case 'table': {
                const tableLayout = await this.layoutTable(token);
                if (tableLayout) {
                    layouts.push(tableLayout);
                }
                break;
            }
            case 'code': {
                const language = String(token.lang || '').trim().toLowerCase();
                if (language === 'mermaid') {
                    const mermaidBlock = await this.renderMermaid(token.text);
                    if (mermaidBlock) {
                        layouts.push(mermaidBlock);
                        break;
                    }
                }
                await this.waitForHighlightJs();
                const paddingX = 14;
                const lines = this.splitCodeSegments(this.highlightCode(token.text || '', token.lang), this.drawWidth - (paddingX * 2));
                const paddingY = 12;
                const marginBottom = this.config.fontSize * 0.8;
                const lineHeight = (this.config.fontSize * 0.82) * (parseFloat(this.config.lineHeight) || 1.6);
                layouts.push({
                    type: 'code-block',
                    lines,
                    paddingX,
                    paddingY,
                    height: (lines.length * lineHeight) + (paddingY * 2) + marginBottom,
                    marginTop: 0, marginBottom
                });
                break;
            }
        }
        return layouts;
    }

    /**
     * 核心方法：处理具有内联样式的文本换行
     */
    async layoutInlineText(inlineTokens, maxWidth = this.drawWidth, inheritedStyle = {}) {
        const lines = [];
        let currentLine = [], currentLineWidth = 0;

        if (!inlineTokens) return [];

        const processTokens = async (tokens, currentStyle) => {
            for (const token of tokens) {
                const style = {
                    fontSize: currentStyle.fontSize || this.config.fontSize,
                    fontWeight: currentStyle.fontWeight || 'normal',
                    fontStyle: currentStyle.fontStyle || 'normal',
                    isHighlight: currentStyle.isHighlight || false,
                    isCode: currentStyle.isCode || false,
                    textDecoration: currentStyle.textDecoration || 'none',
                    headingLevel: currentStyle.headingLevel
                };

                if (token.type === 'strong' || token.type === 'bold') style.fontWeight = '700';
                if (token.type === 'em' || token.type === 'italic') style.fontStyle = 'italic';
                if (token.type === 'codespan' || token.type === 'code') style.isCode = true;
                if (token.type === 'del' || token.type === 'strikethrough') style.textDecoration = 'line-through';
                if (token.type === 'highlight' || (token.raw && token.raw.startsWith('==') && token.raw.endsWith('=='))) {
                    style.isHighlight = true;
                }

                if (token.type === 'br') {
                    if (currentLine.length > 0) lines.push(currentLine);
                    currentLine = [];
                    currentLineWidth = 0;
                    continue;
                }

                if (token.type === 'inlineMath') {
                    const math = await this.renderMath(token.text, false, style.fontSize * 0.74);
                    if (math && math.image) {
                        const segment = {
                            ...style,
                            isMath: true,
                            image: math.image,
                            width: math.width,
                            height: math.height,
                            text: token.text
                        };
                        if (currentLineWidth + segment.width > maxWidth && currentLine.length > 0) {
                            lines.push(currentLine);
                            currentLine = [];
                            currentLineWidth = 0;
                        }
                        currentLine.push(segment);
                        currentLineWidth += segment.width;
                    } else {
                        const text = math ? math.text : `$${token.text}$`;
                        for (const char of Array.from(text)) {
                            const charWidth = this.measureTextWidth(char, style.fontSize, style.fontWeight, style.fontStyle);
                            if (currentLineWidth + charWidth > maxWidth && currentLine.length > 0) {
                                lines.push(currentLine);
                                currentLine = [{ ...style, text: char, isCode: true }];
                                currentLineWidth = charWidth;
                            } else {
                                currentLine.push({ ...style, text: char, isCode: true });
                                currentLineWidth += charWidth;
                            }
                        }
                    }
                    continue;
                }

                if (token.tokens && token.tokens.length > 0) {
                    await processTokens(token.tokens, style);
                } else {
                    const text = token.text || token.raw || '';
                    if (!text) continue;

                    for (const char of Array.from(text)) {
                        const charWidth = this.measureTextWidth(char, style.fontSize, style.fontWeight, style.fontStyle);

                        if (currentLineWidth + charWidth > maxWidth && currentLine.length > 0) {
                            lines.push(currentLine);
                            currentLine = [{ ...style, text: char }];
                            currentLineWidth = charWidth;
                        } else {
                            const last = currentLine[currentLine.length - 1];
                            if (last && !last.isMath && last.fontWeight === style.fontWeight && last.fontStyle === style.fontStyle &&
                                last.isHighlight === style.isHighlight && last.isCode === style.isCode &&
                                last.fontSize === style.fontSize && last.textDecoration === style.textDecoration &&
                                last.headingLevel === style.headingLevel) {
                                last.text += char;
                            } else {
                                currentLine.push({ ...style, text: char });
                            }
                            currentLineWidth += charWidth;
                        }
                    }
                }
            }
        };

        await processTokens(inlineTokens, inheritedStyle);
        if (currentLine.length > 0) lines.push(currentLine);
        return lines;
    }

    getLineHeight(line, config) {
         const configFontSize = parseFloat(config.fontSize) || 16;
         const maxFontSize = Array.isArray(line)
            ? Math.max(...line.map(s => parseFloat(s.height) || parseFloat(s.fontSize) || configFontSize))
            : (parseFloat(line.fontSize) || configFontSize);
         return maxFontSize * (parseFloat(config.lineHeight) || 1.6);
    }

    /**
     * 将布局块拆分为两部分，实现跨页排版
     */
    splitLayout(layout, availableHeight) {
        if (!layout.lines || !Array.isArray(layout.lines) || layout.lines.length === 0) return null;

        const lines = layout.lines;
        const paddingY = layout.type === 'code-block' ? (layout.paddingY || 0) : 0;
        let currentHeight = (layout.marginTop || 0) + paddingY;
        let splitIndex = -1;

        for (let i = 0; i < lines.length; i++) {
            const lineHeight = this.getLineHeight(lines[i], this.config);
            const requiredHeight = currentHeight + lineHeight + paddingY;
            if (requiredHeight > availableHeight) {
                splitIndex = i; break;
            }
            currentHeight += lineHeight;
        }

        if (splitIndex <= 0 || splitIndex >= lines.length) return null;

        const part1 = { ...layout, lines: lines.slice(0, splitIndex), height: currentHeight + paddingY, marginBottom: 0 };
        const part2 = { ...layout, lines: lines.slice(splitIndex), marginTop: 0 };

        let part2ContentHeight = paddingY * 2;
        part2.lines.forEach(line => part2ContentHeight += this.getLineHeight(line, this.config));
        part2.height = part2ContentHeight + (layout.marginBottom || 0);

        if (layout.type === 'list-item') {
            part2.type = 'paragraph'; part2.prefix = '';
        }

        return { part1, part2 };
    }
}

/**
 * CanvasUtils - Canvas 绘图工具集
 */
const CanvasUtils = {
    /**
     * 绘制圆角矩形
     * @param {number|object} radius - 数字或 {tl, tr, bl, br} 对象
     */
    drawRoundedRect(ctx, x, y, width, height, radius, fillStyle, stroke = false, strokeStyle = '') {
        const r = typeof radius === 'number' ? { tl: radius, tr: radius, bl: radius, br: radius } : radius;
        ctx.beginPath();
        ctx.moveTo(x + r.tl, y);
        ctx.lineTo(x + width - r.tr, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + r.tr);
        ctx.lineTo(x + width, y + height - r.br);
        ctx.quadraticCurveTo(x + width, y + height, x + width - r.br, y + height);
        ctx.lineTo(x + r.bl, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - r.bl);
        ctx.lineTo(x, y + r.tl);
        ctx.quadraticCurveTo(x, y, x + r.tl, y);
        ctx.closePath();

        if (fillStyle) { ctx.fillStyle = fillStyle; ctx.fill(); }
        if (stroke) { ctx.strokeStyle = strokeStyle; ctx.lineWidth = 1; ctx.stroke(); }
    },

    /**
     * 将 CSS 渐变语法转换为 CanvasGradient 对象
     * 支持多色值渐变
     */
    createGradient(ctx, cssGradient, width, height) {
        try {
            const angleMatch = cssGradient.match(/(\d+)deg/);
            const angle = angleMatch ? parseInt(angleMatch[1]) : 135;
            const colors = cssGradient.match(/(#[a-fA-F0-9]{6}|#[a-fA-F0-9]{3}|rgba?\(.*?\))/g);
            
            if (!colors || colors.length < 2) return null;

            const rad = (angle - 90) * (Math.PI / 180);
            const len = Math.abs(width * Math.cos(rad)) + Math.abs(height * Math.sin(rad));
            const x0 = width / 2 - Math.cos(rad) * (len / 2);
            const y0 = height / 2 - Math.sin(rad) * (len / 2);
            const x1 = width / 2 + Math.cos(rad) * (len / 2);
            const y1 = height / 2 + Math.sin(rad) * (len / 2);

            const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
            
            // 均匀分布所有颜色点
            colors.forEach((color, index) => {
                gradient.addColorStop(index / (colors.length - 1), color);
            });
            
            return gradient;
        } catch (e) { 
            console.error('Gradient parsing failed:', e);
            return null; 
        }
    },

    /**
     * 测量文本真实宽度
     */
    measureTextWidth(ctx, text, letterSpacing = 0) {
        if (!text) return 0;
        return ctx.measureText(text).width + (text.length * letterSpacing);
    },

    /**
     * 十六进制颜色转 RGBA
     */
    hexToRgba(hex, opacity = 1) {
        if (!hex || typeof hex !== 'string') return `rgba(0,0,0,${opacity})`;
        let h = hex.replace('#', '');
        if (h.length === 3) h = h.split('').map(c => c + c).join('');
        const r = parseInt(h.slice(0, 2), 16);
        const g = parseInt(h.slice(2, 4), 16);
        const b = parseInt(h.slice(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
};

/**
 * TemplateDefinitions
 * 定义每个模板特有的 Canvas 绘制逻辑和布局参数
 */
const TemplateDefinitions = {
    /**
     * 内部页码绘制辅助工具
     */
    _drawPageNumber: (ctx, width, height, index, totalCount, config, options = {}) => {
        if (!config.showPageNumber) return;
        
        const pageNum = config.hasCover ? index : index + 1;
        const totalPage = config.hasCover ? totalCount - 1 : totalCount;
        if (totalPage <= 0) return;

        const {
            color = 'rgba(128, 128, 128, 0.5)',
            font = '500 12px sans-serif',
            textAlign = 'right',
            x = width - 25,
            y = height - 25,
            prefix = '',
            suffix = '',
            padZero = false
        } = options;

        ctx.save();
        ctx.fillStyle = color;
        ctx.font = font;
        ctx.textAlign = textAlign;
        
        const format = (n) => padZero ? String(n).padStart(2, '0') : n;
        const text = `${prefix}${format(pageNum)} / ${format(totalPage)}${suffix}`;
        
        ctx.fillText(text, x, y);
        ctx.restore();
    },

    /**
     * 噪点纹理缓存
     */
    _noiseTextureCache: new Map(),

    /**
     * 生成噪点纹理
     */
    _getNoiseTexture: (width, height) => {
        const key = `${width}x${height}`;
        if (TemplateDefinitions._noiseTextureCache.has(key)) {
            return TemplateDefinitions._noiseTextureCache.get(key);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        const tCtx = canvas.getContext('2d');
        tCtx.globalAlpha = 0.04;
        for (let i = 0; i < 5000; i++) {
            tCtx.fillStyle = Math.random() > 0.5 ? '#000' : '#fff';
            tCtx.fillRect(Math.random() * width, Math.random() * height, 1.2, 1.2);
        }
        TemplateDefinitions._noiseTextureCache.set(key, canvas);
        return canvas;
    },

    /**
     * 纸张纹理缓存
     */
    _paperTextureCache: new Map(),

    /**
     * 生成纸张纹理 (深度优化版：包含噪点、长纤维、以及随机纸浆感)
     */
    _getPaperTexture: (width, height) => {
        const key = `${width}x${height}`;
        if (TemplateDefinitions._paperTextureCache.has(key)) {
            return TemplateDefinitions._paperTextureCache.get(key);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const tCtx = canvas.getContext('2d');

        // 1. 基础极细噪点 (Simulating paper grain)
        tCtx.globalAlpha = 0.06;
        for (let i = 0; i < 8000; i++) {
            const size = Math.random() * 1.5;
            tCtx.fillStyle = Math.random() > 0.5 ? '#8b4513' : '#000';
            tCtx.fillRect(Math.random() * width, Math.random() * height, size, size);
        }
        
        // 2. 模拟随机纸浆团 (Paper pulp / blotches)
        tCtx.globalAlpha = 0.02;
        for (let i = 0; i < 40; i++) {
            const bx = Math.random() * width;
            const by = Math.random() * height;
            const br = 10 + Math.random() * 50;
            const grad = tCtx.createRadialGradient(bx, by, 0, bx, by, br);
            grad.addColorStop(0, '#8b4513');
            grad.addColorStop(1, 'transparent');
            tCtx.fillStyle = grad;
            tCtx.beginPath();
            tCtx.arc(bx, by, br, 0, Math.PI * 2);
            tCtx.fill();
        }

        // 3. 模拟长纤维 (Fine fibers)
        tCtx.globalAlpha = 0.04;
        tCtx.strokeStyle = '#5d4037';
        tCtx.lineWidth = 0.4;
        for (let i = 0; i < 200; i++) {
            const lx = Math.random() * width;
            const ly = Math.random() * height;
            const len = 4 + Math.random() * 12;
            const angle = Math.random() * Math.PI * 2;
            // 绘制稍微弯曲的纤维
            tCtx.beginPath();
            tCtx.moveTo(lx, ly);
            const cp1x = lx + Math.cos(angle) * (len / 3);
            const cp1y = ly + Math.sin(angle) * (len / 3) + (Math.random() * 2 - 1);
            tCtx.quadraticCurveTo(cp1x, cp1y, lx + Math.cos(angle) * len, ly + Math.sin(angle) * len);
            tCtx.stroke();
        }

        TemplateDefinitions._paperTextureCache.set(key, canvas);
        return canvas;
    },

    'blank': {
        /**
         * 空白模板 - 极致简约
         */
        drawForeground: (ctx, width, height, index, totalCount, config) => {
            TemplateDefinitions._drawPageNumber(ctx, width, height, index, totalCount, config);
        },
        getTextStyles: (segment, config) => {
            const accentColor = config.accentColor || '#1A1A1A';
            const textColor = config.textColor || '#1A1A1A';
            if (segment.fontWeight === '700' || segment.fontWeight === '800' || segment.isHighlight || segment.headingLevel) {
                return { textColor: accentColor, highlightColor: CanvasUtils.hexToRgba(accentColor, 0.2) };
            }
            return { textColor };
        }
    },

    'polaroid': {
        /**
         * 复古拍立得 - 相纸留白与复古手写感
         */
        getContentBox: (config, width, height) => {
            const padding = parseFloat(config.textPadding) || 60;
            const marginX = 50, marginY = 60;
            const bottomBlankHeight = 450;
            const photoHeight = height - (marginY * 2) - bottomBlankHeight;
            
            return {
                x: marginX + padding,
                y: marginY + photoHeight + 40,
                width: width - (marginX * 2) - (padding * 2),
                height: bottomBlankHeight - 40 - (config.hasSignature ? 80 : 40)
            };
        },
        drawBackground: (ctx, width, height, config) => {
            ctx.save();
            // 只有在非渐变模式下才填充底色，渐变色由渲染器预先绘制
            if (config.bgMode !== 'gradient') {
                ctx.fillStyle = config.bgColor || '#D6D6D6';
                ctx.fillRect(0, 0, width, height);
            }
            
            // 绘制缓存的复古噪点纹理
            const noise = TemplateDefinitions._getNoiseTexture(width, height);
            ctx.drawImage(noise, 0, 0);
            ctx.restore();
        },
        drawTextAreaBackground: (ctx, rect, config) => {
            const marginX = 50, marginY = 60;
            const paperWidth = PREVIEW_WIDTH - (marginX * 2);
            const paperHeight = PREVIEW_HEIGHT - (marginY * 2);
            
            ctx.save();
            ctx.shadowColor = 'rgba(0,0,0,0.15)';
            ctx.shadowBlur = 30; ctx.shadowOffsetY = 15;
            CanvasUtils.drawRoundedRect(ctx, marginX, marginY, paperWidth, paperHeight, 4, '#FAFAFA');
            ctx.shadowColor = 'transparent';
            
            const photoMargin = 30;
            const photoWidth = paperWidth - (photoMargin * 2);
            const photoHeight = paperHeight - 450;
            
            ctx.fillStyle = '#2C2C2C';
            ctx.fillRect(marginX + photoMargin, marginY + photoMargin, photoWidth, photoHeight);
            
            const grad = ctx.createLinearGradient(marginX + photoMargin, marginY + photoMargin, marginX + photoMargin + photoWidth, marginY + photoMargin + photoHeight);
            grad.addColorStop(0, 'rgba(255,255,255,0.1)'); grad.addColorStop(0.3, 'rgba(255,255,255,0)');
            ctx.fillStyle = grad;
            ctx.fillRect(marginX + photoMargin, marginY + photoMargin, photoWidth, photoHeight);
            ctx.restore();
        },
        drawForeground: (ctx, width, height, index, totalCount, config) => {
            // 胶带
            ctx.save();
            ctx.translate(width / 2, 45); ctx.rotate(-0.05);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.shadowColor = 'rgba(0,0,0,0.1)'; ctx.shadowBlur = 5; ctx.shadowOffsetY = 2;
            ctx.fillRect(-80, -20, 160, 40);
            ctx.restore();

            // 页码：放在右下角留白处
            TemplateDefinitions._drawPageNumber(ctx, width, height, index, totalCount, config, {
                x: width - 75, y: height - 85, color: 'rgba(0,0,0,0.3)', font: 'italic 14px serif', padZero: true
            });
        },
        getTextStyles: (segment, config) => {
            const accentColor = config.accentColor || '#D9534F';
            const textColor = config.textColor || '#2B2B2B';
            if (segment.fontWeight === '700' || segment.fontWeight === '800' || segment.headingLevel) return { textColor: accentColor };
            if (segment.isHighlight) return { textColor: textColor, highlightColor: CanvasUtils.hexToRgba(accentColor, 0.2) };
            return { textColor };
        }
    },

    'notion-style': {
        /**
         * 效率笔记 (Notion风)
         */
        getContentBox: (config, width, height) => {
            const padding = parseFloat(config.textPadding) || 40;
            const topMargin = 120, bottomMargin = config.hasSignature ? 80 : 50;
            return { x: padding, y: topMargin, width: width - (padding * 2), height: height - topMargin - bottomMargin };
        },
        drawForeground: (ctx, width, height, index, totalCount, config) => {
            const padding = parseFloat(config.textPadding) || 40;
            ctx.save();
            ctx.font = '14px ui-sans-serif, system-ui, sans-serif';
            ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
            
            // 使用固定的 Notion 灰 (#9B9A97)，不受用户修改的正文颜色影响
            const fixedMutedColor = '#9B9A97';
            const fixedLineColor = 'rgba(55, 53, 47, 0.08)';

            ctx.fillStyle = '#37352F'; // 图标保持深灰
            ctx.fillText('📖', padding, 60);
            
            ctx.fillStyle = fixedMutedColor;
            ctx.fillText(' /  Workspace  /  Notes', padding + 25, 60);
            
            ctx.strokeStyle = fixedLineColor;
            ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(padding, 90); ctx.lineTo(width - padding, 90); ctx.stroke();
            ctx.restore();
            
            // 页码也使用固定颜色
            TemplateDefinitions._drawPageNumber(ctx, width, height, index, totalCount, config, {
                color: 'rgba(155, 154, 151, 0.7)'
            });
        },
        getTextStyles: (segment, config) => {
            const accentColor = config.accentColor || '#0F7B6C';
            const textColor = config.textColor || '#37352F';
            if (segment.isHighlight) return { textColor: accentColor, highlightColor: CanvasUtils.hexToRgba(accentColor, 0.15) };
            if (segment.fontWeight === '700' || segment.fontWeight === '800' || segment.headingLevel) return { textColor: accentColor };
            return { textColor };
        }
    },

    'elegant-book': {
        /**
         * 书籍内页 - 模拟真实的单页书籍装帧感
         * 设计要点：左侧装订阴影（Gutter），单侧受光，极简边角排版
         */
        getContentBox: (config, width, height) => {
            const padding = parseFloat(config.textPadding) || 55;
            const topMargin = 130; 
            const bottomMargin = config.hasSignature ? 110 : 90;
            // 增加左侧边距以避开装订阴影区
            return { x: padding + 10, y: topMargin, width: width - (padding * 2) - 10, height: height - topMargin - bottomMargin };
        },
        drawBackground: (ctx, width, height, config) => {
            ctx.save();
            
            // 1. 基础纸张色 - 严格水平单侧受光模拟
            // 模拟主光源从右侧射入，纸张从右向左由于远离光源而产生的极其微弱的亮度衰减
            const baseGrad = ctx.createLinearGradient(width, 0, 0, 0);
            const bgColor = config.bgColor || '#FDFBF7';
            baseGrad.addColorStop(0, bgColor); // 右侧最亮（原始纸张色）
            baseGrad.addColorStop(1, CanvasUtils.hexToRgba(bgColor, 0.96)); // 左侧微暗
            ctx.fillStyle = baseGrad;
            ctx.fillRect(0, 0, width, height);
            
            // 2. 绘制离屏缓存的高级纸张纹理
            const texture = TemplateDefinitions._getPaperTexture(width, height);
            ctx.globalCompositeOperation = 'multiply';
            ctx.drawImage(texture, 0, 0);

            // 3. 【美学重构】极致单侧装订阴影 (Left Gutter Only)
            // 彻底移除任何右侧阴影逻辑
            ctx.globalCompositeOperation = 'source-over';
            const gutterGrad = ctx.createLinearGradient(0, 0, width * 0.12, 0);
            gutterGrad.addColorStop(0, 'rgba(0,0,0,0.15)'); // 书脊折痕最深处
            gutterGrad.addColorStop(0.3, 'rgba(0,0,0,0.06)');
            gutterGrad.addColorStop(0.7, 'rgba(0,0,0,0.01)');
            gutterGrad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = gutterGrad;
            ctx.fillRect(0, 0, width * 0.12, height);

            // 4. 纸张右边缘的高光切面 (Edge Highlight)
            // 模拟纸张厚度在受光面产生的微弱高光，增强物理真实感
            const edgeReflect = ctx.createLinearGradient(width - 3, 0, width, 0);
            edgeReflect.addColorStop(0, 'rgba(255,255,255,0)');
            edgeReflect.addColorStop(1, 'rgba(255,255,255,0.4)');
            ctx.fillStyle = edgeReflect;
            ctx.fillRect(width - 3, 0, 3, height);
            
            ctx.restore();
        },
        drawForeground: (ctx, width, height, index, totalCount, config) => {
            const padding = parseFloat(config.textPadding) || 55;
            ctx.save();
            
            // 使用固定的古典墨色
            const fixedMutedInk = 'rgba(93, 64, 55, 0.4)';
            const fixedLineColor = 'rgba(93, 64, 55, 0.12)';
            
            // 顶部装饰
            ctx.strokeStyle = fixedLineColor;
            ctx.lineWidth = 0.8; 
            ctx.beginPath(); 
            ctx.moveTo(padding + 10, 80); 
            ctx.lineTo(width - padding, 80); 
            ctx.stroke();
            
            ctx.fillStyle = fixedMutedInk;
            ctx.font = 'italic 500 11px "Noto Serif SC", serif';
            ctx.textAlign = 'center'; 
            ctx.fillText('C L A S S I C   L I T E R A T U R E', width / 2 + 5, 65);
            
            ctx.fillStyle = '#5D4037';
            ctx.font = '16px serif';
            ctx.fillText('§', padding + 10, 68);

            // 页码：使用统一的物理边角定位
            TemplateDefinitions._drawPageNumber(ctx, width, height, index, totalCount, config, {
                color: fixedMutedInk,
                font: '500 12px "Noto Serif SC", serif',
                prefix: 'P. ',
                padZero: true
            });
            ctx.restore();
        },
        getTextStyles: (segment, config) => {
            const accentColor = config.accentColor || '#8C3A3A';
            const textColor = config.textColor || '#2B2B2B';
            if (segment.fontWeight === '700' || segment.fontWeight === '800' || segment.headingLevel) return { textColor: accentColor };
            if (segment.isHighlight) return { textColor: accentColor, highlightColor: CanvasUtils.hexToRgba(accentColor, 0.1) };
            return { textColor };
        }
    },

    'ios-memo': {
        getContentBox: (config, width, height) => {
            const paperX = 15, paperY = 55, paperW = width - 30, paperH = height - 110;
            const internalPadding = Math.max(10, parseFloat(config.textPadding) || 20); 
            return { x: paperX + internalPadding, y: paperY + internalPadding, width: paperW - (internalPadding * 2), height: paperH - (internalPadding * 2) };
        },
        drawTextAreaBackground: (ctx, rect, config) => {
            const paperX = 15, paperY = 55, paperW = PREVIEW_WIDTH - 30, paperH = PREVIEW_HEIGHT - 110;
            ctx.save();
            ctx.shadowColor = 'rgba(0,0,0,0.05)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 5;
            CanvasUtils.drawRoundedRect(ctx, paperX, paperY, paperW, paperH, 12, '#ffffff');
            ctx.restore();
            ctx.save(); ctx.strokeStyle = '#F2F2F7'; ctx.lineWidth = 1;
            const lineSpacing = (parseFloat(config.fontSize) || 18) * (parseFloat(config.lineHeight) || 1.6);
            for (let y = rect.y + lineSpacing; y < rect.y + rect.height; y += lineSpacing) {
                if (y > paperY + paperH) break;
                ctx.beginPath(); ctx.moveTo(paperX, y); ctx.lineTo(paperX + paperW, y); ctx.stroke();
            }
            ctx.restore();
        },
        drawForeground: (ctx, width, height, index, totalCount, config) => {
            const iosOrange = '#FF9500'; 
            ctx.save();
            ctx.fillStyle = iosOrange; ctx.font = '500 17px sans-serif'; ctx.textAlign = 'right';
            ctx.fillText('完成', width - 25, 35); ctx.textAlign = 'left';
            ctx.beginPath(); ctx.strokeStyle = iosOrange; ctx.lineWidth = 2.5; ctx.moveTo(25, 33); ctx.lineTo(18, 26); ctx.lineTo(25, 19); ctx.stroke();
            ctx.fillText('备忘录', 32, 35);
            const now = new Date();
            const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            ctx.fillStyle = '#8E8E93'; ctx.font = '500 12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(dateStr, width / 2, 35);
            ctx.restore();

            // 如果社交图标底部居中，页码稍微右移避开
            const isBottomCenter = config.hasSocialIcons && config.selectedSocialIcons && config.selectedSocialIcons.length > 0 && config.socialIconPosition === 'bottom-center' && index === 0;
            TemplateDefinitions._drawPageNumber(ctx, width, height, index, totalCount, config, { 
                x: width - 25, 
                y: isBottomCenter ? height - 15 : height - 25 
            });
        },
        getTextStyles: (segment, config) => {
            const accentColor = config.accentColor || '#FF9500', textColor = config.textColor || '#1C1C1E';
            if (segment.fontWeight === '700' || segment.fontWeight === '800' || segment.isHighlight || segment.headingLevel) {
                return { textColor: accentColor, highlightColor: CanvasUtils.hexToRgba(accentColor, 0.15) };
            }
            return { textColor };
        }
    },

    'swiss-studio': {
        getContentBox: (config, width, height) => {
             const padding = parseFloat(config.textPadding) || 35;
             const bottomOffset = config.hasSignature ? Math.max(padding, 60) : padding;
             return { x: padding, y: padding, width: width - (padding * 2), height: height - padding - bottomOffset };
        },
        drawBackground: (ctx, width, height, config) => {
            ctx.save(); ctx.fillStyle = config.accentColor || '#FF4500'; ctx.fillRect(0, 0, 6, height); ctx.restore();
        },
        drawTextAreaBackground: (ctx, rect, config) => {
            ctx.save(); ctx.strokeStyle = 'rgba(0,0,0,0.03)'; ctx.lineWidth = 0.5;
            for(let x = 0; x < PREVIEW_WIDTH; x += 40) {
                if (x < 10) continue;
                ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, PREVIEW_HEIGHT); ctx.stroke();
            }
            ctx.restore();
        },
        drawForeground: (ctx, width, height, index, totalCount, config) => {
            const accentColor = config.accentColor || '#FF4500', decorativeColor = '#1A1A1A';
            const isBottomCenter = config.hasSocialIcons && config.selectedSocialIcons && config.selectedSocialIcons.length > 0 && config.socialIconPosition === 'bottom-center' && index === 0;

            ctx.save();
            ctx.fillStyle = decorativeColor; ctx.font = '700 10px Helvetica'; ctx.textAlign = 'right';
            ctx.fillText('REF. CH-8004', width - 25, 25);
            
            // 如果底部居中有社交图标，则隐藏这个装饰框，防止重叠
            if (!isBottomCenter) {
                ctx.beginPath(); ctx.rect(width - 40, height - 40, 15, 15); ctx.strokeStyle = accentColor; ctx.lineWidth = 2; ctx.stroke();
            }
            ctx.restore();

            TemplateDefinitions._drawPageNumber(ctx, width, height, index, totalCount, config, {
                color: '#1A1A1A', font: '700 10px Helvetica', padZero: true, textAlign: 'left', x: 25, y: height - 25
            });
        },
        getTextStyles: (segment, config) => {
            const accentColor = config.accentColor || '#FF4500', textColor = config.textColor || '#1A1A1A';
            if (segment.headingLevel || segment.fontWeight === '700' || segment.fontWeight === '800') return { textColor: accentColor };
            if (segment.isHighlight) return { highlightColor: accentColor, textColor: '#FFFFFF' };
            return { textColor };
        }
    },

    'minimalist-magazine': {
        getContentBox: (config, width, height) => {
            const padding = parseFloat(config.textPadding) || 45;
            const topMargin = 100, bottomMargin = config.hasSignature ? 80 : 60;
            return { x: padding, y: topMargin, width: width - (padding * 2), height: height - topMargin - bottomMargin };
        },
        drawTextAreaBackground: (ctx, rect, config) => {
            const textColor = config.textColor || '#1A1A1A';
            ctx.save();
            ctx.strokeStyle = CanvasUtils.hexToRgba(textColor, 0.1);
            ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(rect.x, 85); ctx.lineTo(rect.x + rect.width, 85); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(rect.x, PREVIEW_HEIGHT - 55); ctx.lineTo(rect.x + rect.width, PREVIEW_HEIGHT - 55); ctx.stroke();
            ctx.restore();
        },
        drawForeground: (ctx, width, height, index, totalCount, config) => {
            const decorativeColor = '#1A1A1A';
            ctx.save();
            ctx.fillStyle = decorativeColor; ctx.font = 'bold 12px serif';
            ctx.textAlign = 'left'; ctx.fillText('EDITORIAL', 45, 75);
            ctx.fillStyle = CanvasUtils.hexToRgba(decorativeColor, 0.6); ctx.font = 'italic 10px serif';
            ctx.textAlign = 'right'; ctx.fillText('COLLECTION // VOL. 2026', width - 45, 75);
            ctx.restore();
            TemplateDefinitions._drawPageNumber(ctx, width, height, index, totalCount, config, { x: width - 45, y: height - 35 });
        },
        getTextStyles: (segment, config) => {
            const accentColor = config.accentColor || '#1A1A1A';
            const textColor = config.textColor || '#1A1A1A';
            if (segment.fontWeight === '700' || segment.fontWeight === '800' || segment.isHighlight || segment.headingLevel) {
                return { textColor: accentColor, highlightColor: CanvasUtils.hexToRgba(accentColor, 0.15) };
            }
            return { textColor };
        }
    },

    'aura-gradient': {
        getContentBox: (config, width, height) => {
            const cardX = 25, cardY = 30, cardBottomMargin = config.hasSignature ? 60 : 35;
            const padding = parseFloat(config.textPadding) || 35;
            return { x: cardX + padding, y: cardY + padding, width: width - 50 - (padding * 2), height: height - cardY - cardBottomMargin - (padding * 2) };
        },
        drawBackground: (ctx, width, height) => {
            ctx.save();
            const auras = [
                { x: 0, y: 0, r: 1, c1: 'rgba(255, 195, 160, 0.3)', c2: 'rgba(255, 195, 160, 0)' },
                { x: 1, y: 0.2, r: 0.8, c1: 'rgba(255, 175, 189, 0.25)', c2: 'rgba(255, 175, 189, 0)' },
                { x: 0.5, y: 1, r: 1.2, c1: 'rgba(33, 147, 176, 0.15)', c2: 'rgba(33, 147, 176, 0)' }
            ];
            auras.forEach(aura => {
                const grad = ctx.createRadialGradient(width * aura.x, height * aura.y, 0, width * aura.x, height * aura.y, width * aura.r);
                grad.addColorStop(0, aura.c1); grad.addColorStop(1, aura.c2);
                ctx.fillStyle = grad; ctx.fillRect(0, 0, width, height);
            });
            
            // 绘制缓存的噪点纹理
            const noise = TemplateDefinitions._getNoiseTexture(width, height);
            ctx.drawImage(noise, 0, 0);
            ctx.restore();
        },
        drawTextAreaBackground: (ctx, rect, config) => {
            const cardX = 25, cardY = 30, cardBottomMargin = config.hasSignature ? 60 : 35;
            const cardW = PREVIEW_WIDTH - 50, cardH = PREVIEW_HEIGHT - cardY - cardBottomMargin;
            ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.03)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 10;
            CanvasUtils.drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 28, 'rgba(255, 255, 255, 0.5)', true, 'rgba(255, 255, 255, 0.4)');
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)'; ctx.lineWidth = 1.5;
            CanvasUtils.drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 28, null, true);
            ctx.restore();
        },
        drawForeground: (ctx, width, height, index, totalCount, config) => {
            TemplateDefinitions._drawPageNumber(ctx, width, height, index, totalCount, config);
        },
        getTextStyles: (segment, config) => {
            const accentColor = config.accentColor || '#2D3436', textColor = config.textColor || '#2D3436';
            if (segment.fontWeight === '700' || segment.fontWeight === '800' || segment.isHighlight || segment.headingLevel) return { textColor: accentColor, highlightColor: CanvasUtils.hexToRgba(accentColor, 0.2) };
            return { textColor };
        }
    },

    'deep-night': {
        getContentBox: (config, width, height) => {
            const cardX = 20, cardY = 30, cardBottomMargin = config.hasSignature ? 60 : 35;
            const padding = parseFloat(config.textPadding) || 35;
            return { x: cardX + padding, y: cardY + padding, width: width - 40 - (padding * 2), height: height - cardY - cardBottomMargin - (padding * 2) };
        },
        drawBackground: (ctx, width, height, config) => {
            const accentColor = config.accentColor || '#00F5FF';
            ctx.save();
            if (config.bgMode !== 'gradient' && (config.bgColor === '#0D0D0D' || config.bgColor === '#000000')) {
                const grad = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width * 0.8);
                grad.addColorStop(0, '#1a1a1a'); grad.addColorStop(1, '#050505');
                ctx.fillStyle = grad; ctx.fillRect(0, 0, width, height);
            }
            const lineGrad = ctx.createLinearGradient(0, 0, 0, height);
            lineGrad.addColorStop(0, 'transparent'); lineGrad.addColorStop(0.2, accentColor);
            lineGrad.addColorStop(0.8, accentColor); lineGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = lineGrad; ctx.globalAlpha = 0.3; ctx.fillRect(0, 0, 3, height);
            ctx.restore();
        },
        drawTextAreaBackground: (ctx, rect, config) => {
            const cardX = 20, cardY = 30, cardBottomMargin = config.hasSignature ? 60 : 35;
            const cardW = PREVIEW_WIDTH - 40, cardH = PREVIEW_HEIGHT - cardY - cardBottomMargin;
            ctx.save();
            CanvasUtils.drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 16, 'rgba(255,255,255,0.02)', true, 'rgba(255,255,255,0.05)');
            ctx.restore();
        },
        drawForeground: (ctx, width, height, index, totalCount, config) => {
            ctx.save(); ctx.fillStyle = 'rgba(229, 229, 229, 0.3)'; ctx.font = '800 10px Inter, sans-serif'; 
            ctx.textAlign = 'right'; ctx.fillText('// THOUGHT MODE ON', width - 25, 25);
            ctx.strokeStyle = 'rgba(229, 229, 229, 0.2)'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(25, height - 60); ctx.lineTo(width - 25, height - 60); ctx.stroke();
            ctx.restore();
            TemplateDefinitions._drawPageNumber(ctx, width, height, index, totalCount, config, { color: 'rgba(255, 255, 255, 0.3)', textAlign: 'left', x: 25, y: 25 });
        },
        getTextStyles: (segment, config) => {
            const accentColor = config.accentColor || '#00F5FF', textColor = config.textColor || '#E5E5E5';
            if (segment.fontWeight === '700' || segment.fontWeight === '800' || segment.isHighlight || segment.isCode || segment.headingLevel) {
                return { 
                    textColor: accentColor, 
                    highlightColor: CanvasUtils.hexToRgba(accentColor, 0.1),
                    codeBgColor: CanvasUtils.hexToRgba(accentColor, 0.15) 
                };
            }
            return { textColor };
        }
    },

    'pro-doc': {
        getContentBox: (config, width, height) => {
            const winX = 15, winW = width - 30, winY = 40; 
            const winBottomMargin = config.hasSignature ? 60 : 35;
            const winH = height - winY - winBottomMargin;
            const headerHeight = 30, gapBelowHeader = 20;
            const padding = parseFloat(config.textPadding) || 35;
            return { x: winX + padding, y: winY + headerHeight + gapBelowHeader + (padding / 2), width: winW - (padding * 2), height: (winH - headerHeight - gapBelowHeader) - padding };
        },
        drawBackground: (ctx, width, height) => {
            ctx.save(); ctx.strokeStyle = 'rgba(0,102,255,0.02)'; ctx.lineWidth = 0.5;
            for(let i=0; i<width; i+=20){ ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,height); ctx.stroke(); }
            for(let j=0; j<height; j+=20){ ctx.beginPath(); ctx.moveTo(0,j); ctx.lineTo(width,j); ctx.stroke(); }
            ctx.restore();
        },
        drawTextAreaBackground: (ctx, rect, config) => {
            const winX = 15, winW = PREVIEW_WIDTH - 30, winY = 40;
            const winBottomMargin = config.hasSignature ? 60 : 35;
            const winH = PREVIEW_HEIGHT - winY - winBottomMargin;
            const headerHeight = 30, textColor = config.textColor || '#111827';
            ctx.save();
            ctx.shadowColor = 'rgba(0,0,0,0.08)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 10;
            CanvasUtils.drawRoundedRect(ctx, winX, winY, winW, winH, 12, '#ffffff', true, 'rgba(0,0,0,0.05)');
            ctx.restore();
            ctx.save();
            CanvasUtils.drawRoundedRect(ctx, winX, winY, winW, headerHeight, {tl: 12, tr: 12, bl: 0, br: 0}, CanvasUtils.hexToRgba(textColor, 0.05));
            const btnY = winY + headerHeight / 2;
            ctx.fillStyle = '#FF5F56'; ctx.beginPath(); ctx.arc(winX + 20, btnY, 5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#FFBD2E'; ctx.beginPath(); ctx.arc(winX + 38, btnY, 5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#27C93F'; ctx.beginPath(); ctx.arc(winX + 56, btnY, 5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = CanvasUtils.hexToRgba(textColor, 0.4); ctx.font = '700 10px sans-serif'; ctx.textAlign = 'center';
            ctx.fillText('DOCUMENT VIEWER', winX + winW/2, btnY + 4);
            ctx.restore();
        },
        drawForeground: (ctx, width, height, index, totalCount, config) => {
            ctx.save(); ctx.fillStyle = '#6B7280'; ctx.font = '700 9px sans-serif'; ctx.textAlign = 'right';
            ctx.fillText('CONFIDENTIAL / INTERNAL USE ONLY', width - 25, 25);
            ctx.restore();
            TemplateDefinitions._drawPageNumber(ctx, width, height, index, totalCount, config);
        },
        getTextStyles: (segment, config) => {
            const accentColor = config.accentColor || '#0066FF', textColor = config.textColor || '#111827';
            if (segment.fontWeight === '700' || segment.fontWeight === '800' || segment.isHighlight || segment.headingLevel) return { textColor: accentColor, highlightColor: CanvasUtils.hexToRgba(accentColor, 0.08) };
            return { textColor };
        }
    },

    'cinematic-film': {
        /**
         * 电影胶片 - 致敬 Adele《Someone Like You》MV
         * 设计要点：黑白巴黎胶片质感、宽银幕信箱遮幅、35mm胶片颗粒、
         * 胶片齿孔装饰、电影片头式排版
         */
        _filmGrainCache: null,
        _getFilmGrain: function(width, height) {
            if (this._filmGrainCache) return this._filmGrainCache;
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const tCtx = canvas.getContext('2d');

            // 35mm 胶片颗粒 — 比普通噪点更粗、更有机
            for (let i = 0; i < 12000; i++) {
                const x = Math.random() * width;
                const y = Math.random() * height;
                const size = Math.random() * 1.8 + 0.3;
                const brightness = Math.random();
                // 胶片颗粒有冷暖偏差
                if (brightness > 0.6) {
                    tCtx.fillStyle = `rgba(255, 252, 245, ${Math.random() * 0.06})`;
                } else {
                    tCtx.fillStyle = `rgba(0, 0, 0, ${Math.random() * 0.08})`;
                }
                tCtx.fillRect(x, y, size, size);
            }

            // 模拟胶片上的微刮痕
            tCtx.strokeStyle = 'rgba(255, 255, 255, 0.015)';
            tCtx.lineWidth = 0.3;
            for (let i = 0; i < 8; i++) {
                const sx = Math.random() * width;
                tCtx.beginPath();
                tCtx.moveTo(sx, 0);
                tCtx.lineTo(sx + (Math.random() * 3 - 1.5), height);
                tCtx.stroke();
            }

            this._filmGrainCache = canvas;
            return canvas;
        },

        getContentBox: (config, width, height) => {
            const padding = parseFloat(config.textPadding) || 50;
            // 信箱遮幅（letterbox）高度
            const letterboxH = Math.round(height * 0.065);
            const topMargin = letterboxH + 70;
            const bottomMargin = letterboxH + (config.hasSignature ? 80 : 50);
            return {
                x: padding,
                y: topMargin,
                width: width - (padding * 2),
                height: height - topMargin - bottomMargin
            };
        },

        drawBackground: (ctx, width, height, config) => {
            const bgColor = config.bgColor || '#1A1A18';
            const isGradientBg = config.bgMode === 'gradient' && typeof bgColor === 'string' && bgColor.includes('linear-gradient');
            const normalizedSolidBg = (typeof bgColor === 'string') ? bgColor.trim().toLowerCase() : '';
            const isDefaultSolid = !isGradientBg && (normalizedSolidBg === '' || normalizedSolidBg === '#1a1a18');
            ctx.save();

            // 1. 背景基底
            // - 默认纯色：保持原有电影暗房质感（默认视觉不变）
            // - 自定义纯色：使用真正纯色底
            // - 渐变模式：保留通用层已绘制的用户渐变底
            if (isDefaultSolid) {
                const baseGrad = ctx.createRadialGradient(
                    width * 0.5, height * 0.45, 0,
                    width * 0.5, height * 0.45, width * 0.9
                );
                baseGrad.addColorStop(0, '#252320');
                baseGrad.addColorStop(0.6, '#1A1A18');
                baseGrad.addColorStop(1, '#111110');
                ctx.fillStyle = baseGrad;
                ctx.fillRect(0, 0, width, height);
            } else if (!isGradientBg) {
                const solidBgColor = (typeof bgColor === 'string' && !bgColor.includes('linear-gradient')) ? bgColor : '#1A1A18';
                ctx.fillStyle = solidBgColor;
                ctx.fillRect(0, 0, width, height);
            }

            // 2. 电影叠层（默认纯色与渐变模式保留；自定义纯色不叠加渐变层）
            if (isDefaultSolid || isGradientBg) {
                // 暗角 (Vignette) — 电影镜头感的核心
                const vignetteGrad = ctx.createRadialGradient(
                    width * 0.5, height * 0.5, width * 0.25,
                    width * 0.5, height * 0.5, width * 0.85
                );
                vignetteGrad.addColorStop(0, 'rgba(0,0,0,0)');
                vignetteGrad.addColorStop(0.7, 'rgba(0,0,0,0.15)');
                vignetteGrad.addColorStop(1, 'rgba(0,0,0,0.45)');
                ctx.fillStyle = vignetteGrad;
                ctx.fillRect(0, 0, width, height);

                // 右上角微弱漏光 (Light Leak) — 胶片漏光的浪漫瑕疵
                const leakGrad = ctx.createRadialGradient(
                    width * 0.85, height * 0.08, 0,
                    width * 0.85, height * 0.08, width * 0.4
                );
                leakGrad.addColorStop(0, 'rgba(200, 184, 154, 0.06)');
                leakGrad.addColorStop(0.5, 'rgba(200, 184, 154, 0.02)');
                leakGrad.addColorStop(1, 'rgba(200, 184, 154, 0)');
                ctx.fillStyle = leakGrad;
                ctx.fillRect(0, 0, width, height);
            }

            // 4. 绘制 35mm 胶片颗粒纹理
            const filmTemplate = TemplateDefinitions['cinematic-film'];
            const grain = filmTemplate._getFilmGrain(width, height);
            ctx.drawImage(grain, 0, 0);

            ctx.restore();
        },

        drawTextAreaBackground: (ctx, rect, config) => {
            // 文字区域无卡片，仅绘制极淡的水平引导线增加排版感
            ctx.save();
            ctx.strokeStyle = 'rgba(200, 184, 154, 0.04)';
            ctx.lineWidth = 0.5;
            // 上边界线
            ctx.beginPath();
            ctx.moveTo(rect.x, rect.y);
            ctx.lineTo(rect.x + rect.width, rect.y);
            ctx.stroke();
            // 下边界线
            ctx.beginPath();
            ctx.moveTo(rect.x, rect.y + rect.height);
            ctx.lineTo(rect.x + rect.width, rect.y + rect.height);
            ctx.stroke();
            ctx.restore();
        },

        drawForeground: (ctx, width, height, index, totalCount, config) => {
            const accentColor = config.accentColor || '#C8B89A';
            const letterboxH = Math.round(height * 0.065);

            ctx.save();

            // ── 1. 宽银幕信箱遮幅 (Letterbox Bars) ──
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, width, letterboxH);
            ctx.fillRect(0, height - letterboxH, width, letterboxH);

            // 遮幅内侧添加极细的胶片边框线
            ctx.strokeStyle = 'rgba(200, 184, 154, 0.2)';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(0, letterboxH);
            ctx.lineTo(width, letterboxH);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, height - letterboxH);
            ctx.lineTo(width, height - letterboxH);
            ctx.stroke();

            // ── 2. 胶片齿孔 (Sprocket Holes) ──
            // 在顶部和底部遮幅区域绘制齿孔，模拟35mm胶片
            const sprocketW = 8;
            const sprocketH = Math.round(letterboxH * 0.45);
            const sprocketY_top = Math.round((letterboxH - sprocketH) / 2);
            const sprocketY_bottom = height - letterboxH + sprocketY_top;
            const sprocketSpacing = 32;
            const sprocketRadius = 2;

            ctx.fillStyle = 'rgba(200, 184, 154, 0.12)';
            for (let x = 20; x < width - 10; x += sprocketSpacing) {
                // 顶部齿孔
                CanvasUtils.drawRoundedRect(ctx, x, sprocketY_top, sprocketW, sprocketH, sprocketRadius, 'rgba(200, 184, 154, 0.12)');
                // 底部齿孔
                CanvasUtils.drawRoundedRect(ctx, x, sprocketY_bottom, sprocketW, sprocketH, sprocketRadius, 'rgba(200, 184, 154, 0.12)');
            }

            // ── 3. 胶片帧编号 (Frame Counter) ──
            ctx.font = '600 9px "Courier New", monospace';
            ctx.textAlign = 'left';
            ctx.fillStyle = 'rgba(200, 184, 154, 0.35)';
            const frameNum = config.hasCover ? index : index + 1;
            ctx.fillText(`▶ ${String(frameNum).padStart(2, '0')}A`, 14, letterboxH - 6);

            // 胶片码 — 右上角
            ctx.textAlign = 'right';
            ctx.fillStyle = 'rgba(200, 184, 154, 0.25)';
            ctx.font = '500 8px "Courier New", monospace';
            ctx.fillText('KODAK  5222  DOUBLE-X', width - 14, letterboxH - 6);

            // ── 4. 顶部电影标题式装饰 ──
            const headerY = letterboxH + 40;
            ctx.fillStyle = accentColor;
            ctx.globalAlpha = 0.5;
            ctx.font = 'italic 500 11px Georgia, "Noto Serif SC", serif';
            ctx.textAlign = 'center';
            ctx.fillText('— A   C I N E M A T I C   N O T E —', width / 2, headerY);

            // 标题下方的细线
            ctx.globalAlpha = 0.15;
            ctx.strokeStyle = accentColor;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(width * 0.2, headerY + 12);
            ctx.lineTo(width * 0.8, headerY + 12);
            ctx.stroke();

            ctx.globalAlpha = 1;

            // ── 5. 底部电影字幕式页码 ──
            if (config.showPageNumber) {
                const totalPage = config.hasCover ? totalCount - 1 : totalCount;
                if (totalPage > 0) {
                    const pageNum = config.hasCover ? index : index + 1;
                    ctx.fillStyle = 'rgba(200, 184, 154, 0.4)';
                    ctx.font = '500 10px "Courier New", monospace';
                    ctx.textAlign = 'center';
                    ctx.fillText(
                        `SCENE ${String(pageNum).padStart(2, '0')} / ${String(totalPage).padStart(2, '0')}`,
                        width / 2,
                        height - letterboxH + letterboxH * 0.65
                    );
                }
            }

            // ── 6. 底部遮幅区域导演标记 ──
            ctx.fillStyle = 'rgba(200, 184, 154, 0.2)';
            ctx.font = '500 7px "Courier New", monospace';
            ctx.textAlign = 'left';
            ctx.fillText('DIR. ___________', 14, height - 8);
            ctx.textAlign = 'right';
            ctx.fillText('PRINT: FINAL', width - 14, height - 8);

            ctx.restore();
        },

        getTextStyles: (segment, config) => {
            const accentColor = config.accentColor || '#C8B89A';
            const textColor = config.textColor || '#D8D4CE';
            if (segment.fontWeight === '700' || segment.fontWeight === '800' || segment.headingLevel) {
                return { textColor: accentColor };
            }
            if (segment.isHighlight) {
                return {
                    textColor: '#FFFDF5',
                    highlightColor: 'rgba(200, 184, 154, 0.15)'
                };
            }
            if (segment.isCode) {
                return {
                    textColor: accentColor,
                    codeBgColor: 'rgba(200, 184, 154, 0.08)'
                };
            }
            return { textColor };
        }
    },

    getContentBox: (templateId, config, width, height) => {
        if (TemplateDefinitions[templateId] && TemplateDefinitions[templateId].getContentBox) {
            return TemplateDefinitions[templateId].getContentBox(config, width, height);
        }
        const padding = parseFloat(config.textPadding) || 35;
        let topOffset = padding;
        let bottomOffset = padding;
        if (config.hasSignature) {
            bottomOffset = Math.max(padding, 60);
        }
        return {
            x: padding,
            y: topOffset,
            width: width - (padding * 2),
            height: height - topOffset - bottomOffset
        };
    },

    /**
     * 星光质感 - 暗黑背景 + 星光粒子效果
     */
    'starry-night': {
        _starCache: null,
        getStars: function(width, height) {
            if (this._starCache) return this._starCache;
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            
            // 绘制星星
            for (let i = 0; i < 150; i++) {
                const x = Math.random() * width;
                const y = Math.random() * height;
                const size = Math.random() * 2 + 0.5;
                const opacity = Math.random() * 0.8 + 0.2;
                
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
                ctx.fill();
                
                // 某些星星有光晕
                if (Math.random() > 0.7) {
                    const glow = ctx.createRadialGradient(x, y, 0, x, y, size * 4);
                    glow.addColorStop(0, `rgba(255, 255, 255, ${opacity * 0.3})`);
                    glow.addColorStop(1, 'transparent');
                    ctx.fillStyle = glow;
                    ctx.fillRect(x - size * 4, y - size * 4, size * 8, size * 8);
                }
            }
            
            this._starCache = canvas;
            return canvas;
        },
        getContentBox: (config, width, height) => {
            const padding = parseFloat(config.textPadding) || 45;
            const topMargin = 110, bottomMargin = config.hasSignature ? 80 : 60;
            return { x: padding, y: topMargin, width: width - (padding * 2), height: height - topMargin - bottomMargin };
        },
        drawBackground: (ctx, width, height, config) => {
            const accentColor = config.accentColor || '#fbbf24';
            ctx.save();
            
            // 深邃夜空渐变
            const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
            bgGrad.addColorStop(0, '#0c1445');
            bgGrad.addColorStop(0.5, '#1a1a3e');
            bgGrad.addColorStop(1, '#0f0f2d');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, width, height);
            
            // 绘制星星 - 使用模板内部方法
            const starryTemplate = TemplateDefinitions['starry-night'];
            const stars = starryTemplate.getStars(width, height);
            ctx.drawImage(stars, 0, 0);
            
            // 月亮光晕
            const moonGrad = ctx.createRadialGradient(width - 150, 100, 0, width - 150, 100, 200);
            moonGrad.addColorStop(0, 'rgba(251, 191, 36, 0.15)');
            moonGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = moonGrad;
            ctx.fillRect(0, 0, width, height);
            
            ctx.restore();
        },
        drawForeground: (ctx, width, height, index, totalCount, config) => {
            const accentColor = config.accentColor || '#fbbf24';
            ctx.save();
            
            // 顶部装饰线
            ctx.strokeStyle = accentColor;
            ctx.globalAlpha = 0.4;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(45, 85);
            ctx.lineTo(width - 45, 85);
            ctx.stroke();
            
            // 星星图标
            ctx.globalAlpha = 1;
            ctx.fillStyle = accentColor;
            ctx.font = '600 12px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText('✦ STARRY NIGHT', 45, 70);
            
            ctx.restore();
            
            TemplateDefinitions._drawPageNumber(ctx, width, height, index, totalCount, config, {
                color: 'rgba(251, 191, 36, 0.6)',
                font: '600 11px sans-serif'
            });
        },
        getTextStyles: (segment, config) => {
            const accentColor = config.accentColor || '#fbbf24';
            const textColor = config.textColor || '#e2e8f0';
            if (segment.fontWeight === '700' || segment.fontWeight === '800' || segment.isHighlight || segment.headingLevel) {
                return { 
                    textColor: accentColor,
                    highlightColor: 'rgba(251, 191, 36, 0.2)'
                };
            }
            return { textColor };
        }
    }
};

/**
 * CanvasRenderer - 核心画布渲染引擎
 *
 * 设计原则：
 * 1. 声明式渲染：通过 Render Options 描述期望的画布状态。
 * 2. 分层绘制：严格遵循 背景 -> 文本背景 -> 水印 -> 文本 -> 前景 -> 签名 -> 社交图标 的层级顺序。
 * 3. 模板隔离：具体的视觉逻辑由 TemplateDefinitions 定义，渲染器仅负责调用和基础绘图。
 * 4. 高清适配：支持 Scale 参数进行预览与高清输出的无损切换。
 */

const SOCIAL_ICONS = {
    gongzhonghao: { src: 'assets/icons/gongzhonghao.png' },
    shipinhao: { src: 'assets/icons/shipinhao.png' },
    xiaohongshu: { src: 'assets/icons/xiaohongshu.png' },
    zhihu: { src: 'assets/icons/zhihu.png' },
    douyin: { src: 'assets/icons/douyin.png' },
    bilibili: { src: 'assets/icons/bilibili.png' }
};

class CanvasRenderer {
    constructor() {
        this.imageCache = new Map();
        this.socialIconCanvasCache = new Map();
        this.socialIconImageCache = new Map();
    }

    /**
     * 预加载社交图标
     */
    async preloadSocialIcons(iconNames) {
        const loadPromises = iconNames.map(async (iconName) => {
            if (this.socialIconImageCache.has(iconName)) return;
            const iconData = SOCIAL_ICONS[iconName];
            if (!iconData || !iconData.src) return;

            try {
                const img = await this.loadImage(iconData.src);
                this.socialIconImageCache.set(iconName, img);
            } catch (e) {
                console.error('Failed to load social icon:', iconName, e);
            }
        });
        await Promise.all(loadPromises);
    }

    /**
     * 加载图片并缓存
     */
    async loadImage(src) {
        if (this.imageCache.has(src)) return this.imageCache.get(src);
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                this.imageCache.set(src, img);
                resolve(img);
            };
            img.onerror = () => resolve(null);
            img.src = src;
        });
    }

    async render(options) {
        const {
            layouts, index, totalCount, config, templateId,
            width = PREVIEW_WIDTH, height = PREVIEW_HEIGHT, scale = 1
        } = options;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = width * scale;
        canvas.height = height * scale;
        ctx.scale(scale, scale);

        // 1. 预加载必要的图片 (如封面、正文插图)
        const imageLoadPromises = [];
        layouts.forEach(layout => {
            if (layout.type === 'cover' && layout.image) {
                imageLoadPromises.push(this.loadImage(layout.image));
            } else if (layout.type === 'image' && layout.src) {
                imageLoadPromises.push(this.loadImage(layout.src));
            }
        });
        await Promise.all(imageLoadPromises);

        // 2. 绘制基础背景
        this.drawTemplateBackground(ctx, templateId, config, width, height);

        // 3. 绘制文本区域背景 (如备忘录纸张、模拟窗口)
        const textAreaRect = this.getTextAreaRect(config, width, height, templateId);
        this.drawTextAreaBackground(ctx, templateId, config, textAreaRect);

        // 4. 绘制水印 (位于文字之下)
        if (config.hasWatermark) {
            this.drawWatermark(ctx, config, width, height);
        }

        // 5. 核心内容渲染 (封面或普通文本)
        if (layouts.length === 1 && layouts[0].type === 'cover') {
            this.drawCoverContent(ctx, layouts[0], config, width, height, templateId);
        } else {
            this.drawTextContent(ctx, layouts, config, textAreaRect, templateId);
        }

        // 6. 绘制模板前景 (如顶部装饰、边框)
        const isCover = layouts.length === 1 && layouts[0].type === 'cover';
        this.drawTemplateForeground(ctx, templateId, config, width, height, index, totalCount, isCover);

        // 7. 绘制签名栏
        if (config.hasSignature) {
            this.drawSignature(ctx, config, width, height, templateId);
        }

        // 8. 绘制社交媒体图标（仅封面页）
        if (isCover && config.hasSocialIcons && config.selectedSocialIcons) {
            await this.preloadSocialIcons(config.selectedSocialIcons);
            this.drawSocialIcons(ctx, config, width, height, templateId);
        }

        // 9. 辅助网格 (辅助排版对齐)
        if (config.showGrid) {
            this.drawGridLayout(ctx, textAreaRect, layouts);
        }

        return canvas;
    }

    /**
     * 绘制图文封面 - 上下分栏风格
     * 上 60%: 图片
     * 下 40%: 标题
     */
    drawCoverContent(ctx, layout, config, width, height, templateId) {
        const img = this.imageCache.get(layout.image);
        const padding = parseFloat(config.textPadding) || 40;

        // 定义分栏比例 (0.6 = 60% 图片高度)
        const splitRatio = 0.6;
        const imageH = height * splitRatio;
        const textH = height - imageH;
        const textY = imageH;

        ctx.save();

        // 1. 绘制上半部分：图片
        if (img) {
            const scale = Math.max(width / img.width, imageH / img.height);
            const x = (width / 2) - (img.width / 2) * scale;
            const y = (imageH / 2) - (img.height / 2) * scale;

            ctx.beginPath();
            ctx.rect(0, 0, width, imageH);
            ctx.clip();

            ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

            // 可选：添加轻微内阴影增加层次感
            // ctx.shadowColor = 'rgba(0,0,0,0.1)';
            // ctx.shadowBlur = 20;
            // ctx.shadowOffsetY = 5;
            // ctx.shadowOffsetX = 0;
            // ctx.rect(0, 0, width, imageH);
            // ctx.stroke();

            ctx.restore(); // 恢复 clip
        } else {
            // 占位图
            ctx.fillStyle = '#f0f0f0';
            ctx.fillRect(0, 0, width, imageH);
            ctx.fillStyle = '#ccc';
            ctx.font = '24px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('请上传封面图片', width / 2, imageH / 2);
        }

        // 2. 绘制下半部分：标题
        // 背景色已经由 drawTemplateBackground 绘制，此处只需绘制文字

        ctx.save();

        const fontSize = parseFloat(config.coverFontSize) || 48;
        const fontFamily = config.fontFamily === 'inherit' ? "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'PingFang SC', 'Helvetica Neue', sans-serif" : (config.fontFamily || "sans-serif");

        // 字体颜色使用 accentColor (强调色)
        ctx.fillStyle = config.accentColor || '#000000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `800 ${fontSize}px ${fontFamily}`;

        // 支持配置换行: 既支持真实换行，也支持 "\\n" 字面量
        const titleText = String(layout.title || '未命名文档').replace(/\\n/g, '\n');
        const maxWidth = width - (padding * 2);
        const lines = [];
        const paragraphs = titleText.split('\n');

        paragraphs.forEach((paragraph) => {
            // 保留空行，方便做电影感标题排版
            if (!paragraph) {
                lines.push('');
                return;
            }

            const chars = paragraph.split('');
            let line = '';
            for (let n = 0; n < chars.length; n++) {
                const testLine = line + chars[n];
                const metrics = ctx.measureText(testLine);
                if (metrics.width > maxWidth && n > 0) {
                    lines.push(line);
                    line = chars[n];
                } else {
                    line = testLine;
                }
            }
            if (line) {
                lines.push(line);
            }
        });

        const lineHeight = fontSize * (parseFloat(config.coverLineHeight) || 1.4);
        const totalTextHeight = lines.length * lineHeight;
        // 垂直居中于下半部分
        let startY = textY + (textH / 2) - (totalTextHeight / 2) + (fontSize * 0.4);

        lines.forEach((l, i) => {
            ctx.shadowColor = 'transparent'; // 移除阴影
            ctx.fillText(l, width / 2, startY + (i * lineHeight));
        });

        // 3. 模板特定装饰器 (适配新布局)
        if (templateId === 'minimalist-magazine') {
            ctx.font = 'bold 14px "Source Han Serif SC", serif';
            ctx.textAlign = 'left';
            ctx.fillStyle = config.accentColor || '#000';
            // 移到文字区域左上角
            ctx.fillText('SPECIAL EDITION', padding, textY + 40);

            ctx.beginPath();
            ctx.moveTo(padding, textY + 55);
            ctx.lineTo(padding + 100, textY + 55);
            ctx.strokeStyle = config.accentColor || '#000';
            ctx.stroke();

        } else if (templateId === 'swiss-studio') {
             // 左侧色条保持通栏
             ctx.fillStyle = config.accentColor || '#FF4500';
             ctx.fillRect(0, 0, 10, height);

        } else if (templateId === 'deep-night') {
             // 边框装饰保持全屏
             ctx.strokeStyle = config.accentColor || '#00F5FF';
             ctx.lineWidth = 2;
             ctx.strokeRect(20, 20, width - 40, height - 40);

        } else if (templateId === 'cinematic-film') {
             // 电影胶片：封面也保留信箱遮幅 + 齿孔 + 胶片颗粒
             const letterboxH = Math.round(height * 0.065);
             const accentColor = config.accentColor || '#C8B89A';

             // 暗角
             const vignetteGrad = ctx.createRadialGradient(
                 width * 0.5, height * 0.5, width * 0.25,
                 width * 0.5, height * 0.5, width * 0.85
             );
             vignetteGrad.addColorStop(0, 'rgba(0,0,0,0)');
             vignetteGrad.addColorStop(0.7, 'rgba(0,0,0,0.2)');
             vignetteGrad.addColorStop(1, 'rgba(0,0,0,0.5)');
             ctx.fillStyle = vignetteGrad;
             ctx.fillRect(0, 0, width, height);

             // 信箱遮幅
             ctx.fillStyle = '#000000';
             ctx.fillRect(0, 0, width, letterboxH);
             ctx.fillRect(0, height - letterboxH, width, letterboxH);

             // 齿孔
             const sprocketW = 8;
             const sprocketH = Math.round(letterboxH * 0.45);
             const sprocketY_top = Math.round((letterboxH - sprocketH) / 2);
             const sprocketY_bottom = height - letterboxH + sprocketY_top;
             for (let x = 20; x < width - 10; x += 32) {
                 CanvasUtils.drawRoundedRect(ctx, x, sprocketY_top, sprocketW, sprocketH, 2, 'rgba(200, 184, 154, 0.12)');
                 CanvasUtils.drawRoundedRect(ctx, x, sprocketY_bottom, sprocketW, sprocketH, 2, 'rgba(200, 184, 154, 0.12)');
             }

             // 胶片编码
             ctx.font = '500 8px "Courier New", monospace';
             ctx.textAlign = 'right';
             ctx.fillStyle = 'rgba(200, 184, 154, 0.25)';
             ctx.fillText('KODAK  5222  DOUBLE-X', width - 14, letterboxH - 6);
        }

        ctx.restore();
    }

    /**
     * 绘制辅助网格，用于排版对齐查看
     */
    drawGridLayout(ctx, textAreaRect, layouts) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(textAreaRect.x, textAreaRect.y, textAreaRect.width, textAreaRect.height);

        let currentY = textAreaRect.y;
        ctx.strokeStyle = 'rgba(0, 0, 255, 0.2)';

        layouts.forEach(layout => {
            if (layout.type !== 'space') {
                const y = currentY + (layout.marginTop || 0);
                const h = layout.height - (layout.marginTop || 0) - (layout.marginBottom || 0);
                ctx.strokeRect(textAreaRect.x, y, textAreaRect.width, h);
            }
            currentY += layout.height;
        });
        ctx.restore();
    }

    /**
     * 获取内容框位置，遵循 TemplateDefinitions 的唯一真理
     */
    getTextAreaRect(config, width, height, templateId) {
        if (typeof TemplateDefinitions.getContentBox === 'function') {
             return TemplateDefinitions.getContentBox(templateId, config, width, height);
        }
        const padding = parseFloat(config.textPadding) || 35;
        return { x: padding, y: padding, width: width - (padding * 2), height: height - (padding * 2) };
    }

    drawBackground(ctx, config, width, height) {
        ctx.save();
        if (config.bgMode === 'gradient' && typeof config.bgColor === 'string' && config.bgColor.includes('linear-gradient')) {
            const gradient = CanvasUtils.createGradient(ctx, config.bgColor, width, height);
            ctx.fillStyle = gradient || '#ffffff';
        } else {
            ctx.fillStyle = config.bgColor || '#ffffff';
        }
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
    }

    drawTemplateBackground(ctx, templateId, config, width, height) {
        this.drawBackground(ctx, config, width, height);
        const template = TemplateDefinitions[templateId];
        if (template && template.drawBackground) {
            ctx.save();
            template.drawBackground(ctx, width, height, config);
            ctx.restore();
        }
    }

    drawTextAreaBackground(ctx, templateId, config, rect) {
        const template = TemplateDefinitions[templateId];
        if (template && template.drawTextAreaBackground) {
            ctx.save();
            template.drawTextAreaBackground(ctx, rect, config);
            ctx.restore();
        }
    }

    drawTemplateForeground(ctx, templateId, config, width, height, index = 0, totalCount = 1, isCover = false) {
        if (isCover) return; // 封面不绘制页码等通用装饰

        const template = TemplateDefinitions[templateId];
        if (template && template.drawForeground) {
            ctx.save();
            template.drawForeground(ctx, width, height, index, totalCount, config);
            ctx.restore();
        }
    }

    drawWatermark(ctx, config, width, height) {
        ctx.save();
        ctx.fillStyle = config.watermarkColor || 'rgba(0,0,0,0.05)';
        ctx.font = '500 14px sans-serif';
        ctx.translate(width / 2, height / 2);
        ctx.rotate(-Math.PI / 6);
        const text = config.watermarkText || DEFAULT_BRAND_TEXT;
        for (let x = -width; x < width; x += 180) {
            for (let y = -height; y < height; y += 120) {
                ctx.fillText(text, x, y);
            }
        }
        ctx.restore();
    }

    drawTextContent(ctx, layouts, config, textAreaRect, templateId) {
        let currentY = textAreaRect.y;
        ctx.save();
        ctx.textBaseline = 'top';
        const template = TemplateDefinitions[templateId];

        for (const layout of layouts) {
            if (layout.type === 'space') {
                currentY += layout.height;
                continue;
            }
            const contentY = currentY + (layout.marginTop || 0);
            if (layout.type === 'heading') {
                this.drawStyledLines(ctx, layout.lines, textAreaRect.x, contentY, config, templateId, textAreaRect.width, layout.align);
            } else if (layout.type === 'blockquote') {
                const indent = layout.indent || 20;
                let quoteBarColor = config.accentColor || 'rgba(0,0,0,0.1)';
                ctx.fillStyle = quoteBarColor;
                ctx.fillRect(textAreaRect.x, contentY, templateId === 'deep-night' ? 2 : 3, layout.height - (layout.marginTop || 0) - (layout.marginBottom || 0));
                this.drawStyledLines(ctx, layout.lines, textAreaRect.x + indent, contentY, config, templateId, textAreaRect.width - indent, layout.align);
            } else if (layout.type === 'list-item') {
                const fontSize = parseFloat(config.fontSize) || 16;
                const fontFamily = config.fontFamily === 'inherit' ? "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', sans-serif" : (config.fontFamily || "sans-serif");
                ctx.font = `500 ${fontSize}px ${fontFamily}`;
                let prefixColor = config.accentColor || config.textColor;
                ctx.fillStyle = prefixColor;
                ctx.fillText(layout.prefix, textAreaRect.x, contentY);
                this.drawStyledLines(ctx, layout.lines, textAreaRect.x + layout.prefixWidth, contentY, config, templateId, textAreaRect.width - layout.prefixWidth, layout.align);
            } else if (layout.type === 'image') {
                this.drawInlineImage(ctx, layout, textAreaRect.x, contentY);
            } else if (layout.type === 'math-block') {
                this.drawMathBlock(ctx, layout, textAreaRect.x, contentY, textAreaRect.width);
            } else if (layout.type === 'mermaid-block') {
                this.drawMermaidBlock(ctx, layout, textAreaRect.x, contentY, textAreaRect.width);
            } else if (layout.type === 'table-grid') {
                this.drawTableGrid(ctx, layout, textAreaRect.x, contentY, config, templateId);
            } else if (layout.type === 'render-error') {
                this.drawRenderError(ctx, layout, textAreaRect.x, contentY, textAreaRect.width, config);
            } else if (layout.type === 'code-block') {
                this.drawCodeBlock(ctx, layout, textAreaRect.x, contentY, config, templateId, textAreaRect.width);
            } else if (layout.lines) {
                this.drawStyledLines(ctx, layout.lines, textAreaRect.x, contentY, config, templateId, textAreaRect.width, layout.align);
            }
            currentY += layout.height;
        }
        ctx.restore();
    }

    drawMathBlock(ctx, layout, x, y, maxWidth) {
        if (!layout.image) return;
        const drawX = layout.align === 'center' ? x + (maxWidth - layout.width) / 2 : x;
        ctx.drawImage(layout.image, drawX, y, layout.width, layout.contentHeight);
    }

    drawMermaidBlock(ctx, layout, x, y, maxWidth) {
        if (!layout.image) return;
        const drawX = x + (maxWidth - layout.width) / 2;
        const drawY = y + (layout.paddingY || 0);
        ctx.drawImage(layout.image, drawX, drawY, layout.width, layout.contentHeight);
    }

    drawRenderError(ctx, layout, x, y, maxWidth, config) {
        const boxHeight = layout.height - (layout.marginBottom || 0);
        const isLightText = this.isColorLight(config.textColor || '#111111');
        const background = isLightText ? 'rgba(248, 113, 113, 0.12)' : 'rgba(185, 28, 28, 0.06)';
        const border = isLightText ? 'rgba(252, 165, 165, 0.35)' : 'rgba(185, 28, 28, 0.20)';
        const textColor = isLightText ? '#fecaca' : '#991b1b';
        const fontSize = parseFloat(config.fontSize) || 16;
        const fontFamily = config.fontFamily === 'inherit'
            ? "-apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif"
            : (config.fontFamily || 'sans-serif');

        ctx.save();
        CanvasUtils.drawRoundedRect(ctx, x, y, maxWidth, boxHeight, 8, background, true, border);
        ctx.fillStyle = textColor;
        ctx.font = `600 ${fontSize * 0.9}px ${fontFamily}`;
        ctx.textAlign = 'left';
        ctx.fillText(`⚠ ${layout.message}`, x + 14, y + (boxHeight - fontSize) / 2);
        ctx.restore();
    }

    isColorLight(colorStr) {
        if (!colorStr) return false;
        colorStr = colorStr.trim().toLowerCase();
        if (colorStr.startsWith('#')) {
            const hex = colorStr.substring(1);
            if (hex.length === 3) {
                const r = parseInt(hex[0] + hex[0], 16);
                const g = parseInt(hex[1] + hex[1], 16);
                const b = parseInt(hex[2] + hex[2], 16);
                return (r * 0.299 + g * 0.587 + b * 0.114) > 186;
            } else if (hex.length === 6) {
                const r = parseInt(hex.substring(0, 2), 16);
                const g = parseInt(hex.substring(2, 4), 16);
                const b = parseInt(hex.substring(4, 6), 16);
                return (r * 0.299 + g * 0.587 + b * 0.114) > 186;
            }
        } else if (colorStr.startsWith('rgb')) {
            const match = colorStr.match(/\d+/g);
            if (match && match.length >= 3) {
                const r = parseInt(match[0]);
                const g = parseInt(match[1]);
                const b = parseInt(match[2]);
                return (r * 0.299 + g * 0.587 + b * 0.114) > 186;
            }
        }
        return false;
    }

    drawTableGrid(ctx, layout, x, y, config, templateId) {
        const rows = layout.rows;
        const cellPaddingX = layout.cellPaddingX || 8;
        const cellPaddingY = layout.cellPaddingY || 8;
        const isDarkText = this.isColorLight(config.textColor || '#111111');
        const borderStyle = isDarkText ? 'rgba(255,255,255,0.18)' : 'rgba(15,23,42,0.13)';
        const headerBorderStyle = isDarkText ? 'rgba(255,255,255,0.34)' : 'rgba(15,23,42,0.28)';
        const headerBgColor = isDarkText ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.035)';
        const baseLineHeight = (parseFloat(config.fontSize) || 16) * (parseFloat(config.lineHeight) || 1.6);

        let currentY = y;

        ctx.save();
        for (let r = 0; r < rows.length; r++) {
            const row = rows[r];
            const rowHeight = row.height;
            let currentX = x;

            for (let c = 0; c < row.cells.length; c++) {
                const cell = row.cells[c];
                const cellWidth = cell.width;

                if (cell.isHeader) {
                    ctx.fillStyle = headerBgColor;
                    ctx.fillRect(currentX, currentY, cellWidth, rowHeight);
                }

                const textHeight = cell.lines.length * baseLineHeight;
                const textY = currentY + cellPaddingY + (rowHeight - cellPaddingY * 2 - textHeight) / 2;
                this.drawStyledLines(
                    ctx,
                    cell.lines,
                    currentX + cellPaddingX,
                    textY,
                    config,
                    templateId,
                    cellWidth - cellPaddingX * 2,
                    cell.align
                );
                currentX += cellWidth;
            }

            ctx.beginPath();
            ctx.strokeStyle = row.isHeaderRow ? headerBorderStyle : borderStyle;
            ctx.lineWidth = row.isHeaderRow ? 1.5 : 1;
            ctx.moveTo(x, currentY + rowHeight);
            ctx.lineTo(x + layout.colWidths.reduce((sum, width) => sum + width, 0), currentY + rowHeight);
            ctx.stroke();
            currentY += rowHeight;
        }
        ctx.restore();
    }

    drawCodeBlock(ctx, layout, x, y, config, templateId, maxWidth) {
        const paddingX = layout.paddingX || 12;
        const paddingY = layout.paddingY || 10;
        const contentHeight = layout.height - (layout.marginBottom || 0);
        let bgColor = 'rgba(15, 23, 42, 0.06)';
        let borderColor = 'rgba(15, 23, 42, 0.10)';
        const template = TemplateDefinitions[templateId];
        if (template && template.getTextStyles) {
            const styles = template.getTextStyles({ isCode: true }, config);
            if (styles && styles.codeBgColor) bgColor = styles.codeBgColor;
        }

        ctx.save();
        CanvasUtils.drawRoundedRect(ctx, x, y, maxWidth, contentHeight, 8, bgColor, true, borderColor);
        this.drawStyledLines(
            ctx,
            layout.lines,
            x + paddingX,
            y + paddingY,
            config,
            templateId,
            maxWidth - (paddingX * 2),
            layout.align
        );
        ctx.restore();
    }

    /**
     * 绘制正文中的图片
     */
    drawInlineImage(ctx, layout, x, y) {
        const img = this.imageCache.get(layout.src);
        if (img) {
            const drawH = layout.contentHeight;
            const drawW = layout.width;

            ctx.save();
            // 绘制圆角图片
            ctx.beginPath();
            CanvasUtils.drawRoundedRect(ctx, x, y, drawW, drawH, 8);
            ctx.clip();
            ctx.drawImage(img, x, y, drawW, drawH);
            ctx.restore();
        } else {
            // 绘制占位符
            ctx.fillStyle = '#f5f5f5';
            ctx.fillRect(x, y, layout.width, layout.contentHeight);
            ctx.fillStyle = '#999';
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('图片加载失败', x + layout.width / 2, y + layout.contentHeight / 2);
        }
    }

    drawStyledLines(ctx, lines, startX, startY, config, templateId, maxWidth = null, align = 'left') {
        if (!lines || !Array.isArray(lines)) return;
        let lineY = startY;
        const configFontSize = parseFloat(config.fontSize) || 16;
        const drawWidth = maxWidth || 0;

        for (const lineSegments of lines) {
            let segmentX = startX;
            let maxFontSize = configFontSize;

            if (Array.isArray(lineSegments) && lineSegments.length > 0) {
                maxFontSize = Math.max(...lineSegments.map(s => parseFloat(s.fontSize) || configFontSize));
            } else if (lineSegments && lineSegments.fontSize) {
                maxFontSize = parseFloat(lineSegments.fontSize);
            }

            const lineHeight = maxFontSize * (parseFloat(config.lineHeight) || 1.6);
            const letterSpacing = parseFloat(config.letterSpacing) || 0;

            // 居中或右对齐：按整行宽度计算起点，再逐段绘制
            if ((align === 'center' || align === 'right') && drawWidth > 0 && Array.isArray(lineSegments)) {
                let lineWidth = 0;
                for (const segment of lineSegments) {
                    if (segment.isMath) {
                        lineWidth += segment.width || 0;
                        continue;
                    }
                    const fontStyle = segment.fontStyle || 'normal';
                    const fontWeight = segment.fontWeight || 'normal';
                    const fontSize = parseFloat(segment.fontSize) || parseFloat(config.fontSize) || 16;
                    const fontFamily = segment.fontFamily || (config.fontFamily === 'inherit'
                        ? "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', sans-serif"
                        : (config.fontFamily || 'sans-serif'));
                    ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
                    lineWidth += CanvasUtils.measureTextWidth(ctx, segment.text || '', letterSpacing);
                }
                segmentX = align === 'right'
                    ? startX + drawWidth - lineWidth
                    : startX + (drawWidth - lineWidth) / 2;
            }

            if (Array.isArray(lineSegments)) {
                for (const segment of lineSegments) {
                    this.drawSegment(ctx, segment, segmentX, lineY, config, templateId);
                    if (segment.isMath) {
                        segmentX += segment.width || 0;
                    } else {
                        segmentX += CanvasUtils.measureTextWidth(ctx, segment.text, letterSpacing);
                    }
                }
            } else {
                this.drawSegment(ctx, lineSegments, segmentX, lineY, config, templateId);
            }
            lineY += lineHeight;
        }
    }

    drawSegment(ctx, segment, x, y, config, templateId) {
        if (segment.isMath && segment.image) {
            ctx.drawImage(segment.image, x, y, segment.width, segment.height);
            return;
        }

        const fontStyle = segment.fontStyle || 'normal';
        const fontWeight = segment.fontWeight || 'normal';
        const fontSize = parseFloat(segment.fontSize) || parseFloat(config.fontSize) || 16;
        const fontFamily = segment.fontFamily || (config.fontFamily === 'inherit' ? "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', sans-serif" : (config.fontFamily || "sans-serif"));
        ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;

        let textColor = segment.color || config.textColor;
        let highlightColor = 'rgba(255, 243, 191, 0.7)';
        let codeBgColor = 'rgba(0,0,0,0.04)';

        const template = TemplateDefinitions[templateId];
        if (template && template.getTextStyles) {
            const styles = template.getTextStyles(segment, config);
            if (styles) {
                if (styles.textColor && !segment.color) textColor = styles.textColor;
                if (styles.highlightColor) highlightColor = styles.highlightColor;
                if (styles.codeBgColor) codeBgColor = styles.codeBgColor;
            }
        }

        const letterSpacing = parseFloat(config.letterSpacing) || 0;
        const metrics = ctx.measureText(segment.text);
        const width = metrics.width + (segment.text.length * letterSpacing);

        if (segment.isHighlight) {
            ctx.fillStyle = highlightColor;
            ctx.fillRect(x, y + fontSize * 0.1, width, fontSize * 1.1);
        } else if (segment.isCode && !segment.isCodeBlock) {
            ctx.fillStyle = codeBgColor;
            CanvasUtils.drawRoundedRect(ctx, x - 2, y + 1, width + 4, fontSize * 1.3, 4, ctx.fillStyle);
        }

        ctx.fillStyle = textColor;
        ctx.fillText(segment.text, x, y);

        if (segment.textDecoration === 'line-through') {
            ctx.strokeStyle = textColor;
            ctx.lineWidth = Math.max(1, fontSize / 14);
            ctx.beginPath();
            ctx.moveTo(x, y + fontSize * 0.52);
            ctx.lineTo(x + width, y + fontSize * 0.52);
            ctx.stroke();
        }
    }

    drawSignature(ctx, config, width, height, templateId) {
        const sigText = config.signatureText || DEFAULT_BRAND_TEXT;
        const sigColor = config.signatureColor || '#555555';
        const sigStyle = config.signatureStyle || 'modern-pill';
        const fontFamily = config.fontFamily === 'inherit' ? "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', sans-serif" : (config.fontFamily || "sans-serif");
        const template = TemplateDefinitions[templateId];

        // 如果社交图标在底部居中，则将签名上移，确保图标在最底部且紧密连接
        let bottomOffset = 0;
        if (config.hasSocialIcons && config.selectedSocialIcons && config.selectedSocialIcons.length > 0 && config.socialIconPosition === 'bottom-center') {
            // 针对特定模板（备忘录、大厂文档、苏黎世、星光质感）增加额外偏移，防止与自带 UI 重叠
            const extraTemplates = ['ios-memo', 'pro-doc', 'swiss-studio', 'starry-night'];
            bottomOffset = extraTemplates.includes(templateId) ? 35 : 12;
        }

        ctx.save();
        if (sigStyle === 'terminal') {
            let barBg = '#222';
            let cursorColor = '#39FF14';
            if (template && template.terminalStyles) {
                const styles = typeof template.terminalStyles === 'function' ? template.terminalStyles(config) : template.terminalStyles;
                if (styles.bg) barBg = styles.bg;
                if (styles.text) cursorColor = styles.text;
            }

            const barHeight = 40;
            ctx.fillStyle = barBg;
            ctx.fillRect(0, height - barHeight - bottomOffset, width, barHeight);
            ctx.font = '700 13px monospace';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = cursorColor;
            ctx.textAlign = 'left';
            ctx.fillText('> _', 25, height - barHeight / 2 - bottomOffset);
            ctx.fillStyle = sigColor;
            ctx.textAlign = 'right';
            ctx.fillText(sigText, width - 25, height - barHeight / 2 - bottomOffset);
        } else if (sigStyle === 'modern-pill') {
            ctx.font = `600 13px ${fontFamily}`;
            const metrics = ctx.measureText(sigText);
            const pillWidth = metrics.width + 40;
            const pillHeight = 30;
            const pillY = height - 42 - bottomOffset;
            CanvasUtils.drawRoundedRect(ctx, (width - pillWidth) / 2, pillY, pillWidth, pillHeight, 15, sigColor);
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.fillText(sigText, width / 2, pillY + pillHeight / 2 + 5);
        } else if (sigStyle === 'elegant-serif') {
            ctx.font = `italic 600 15px serif`;
            const textWidth = ctx.measureText(sigText).width;
            const lineWidth = 40, gap = 12;
            const startX = (width - (textWidth + (lineWidth + gap) * 2)) / 2;
            const y = height - 35 - bottomOffset;
            ctx.strokeStyle = sigColor;
            ctx.globalAlpha = 0.4;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(startX, y); ctx.lineTo(startX + lineWidth, y);
            ctx.moveTo(width - startX - lineWidth, y); ctx.lineTo(width - startX, y);
            ctx.stroke();
            ctx.fillStyle = sigColor; ctx.globalAlpha = 1; ctx.textAlign = 'center';
            ctx.fillText(sigText, width / 2, y + 6);
        } else if (sigStyle === 'glass-minimal') {
            ctx.font = `600 13px ${fontFamily}`;
            const boxWidth = ctx.measureText(sigText).width + 30;
            const boxHeight = 32, y = height - 45 - bottomOffset;
            CanvasUtils.drawRoundedRect(ctx, (width - boxWidth) / 2, y, boxWidth, boxHeight, 16, 'rgba(255, 255, 255, 0.25)', true, 'rgba(255, 255, 255, 0.2)');
            ctx.fillStyle = sigColor; ctx.textAlign = 'center';
            ctx.fillText(sigText, width / 2, y + boxHeight / 2 + 5);
        } else {
            ctx.fillStyle = sigColor; ctx.font = `600 13px ${fontFamily}`; ctx.textAlign = 'center';
            ctx.fillText(sigText, width / 2, height - 30 - bottomOffset);
        }
        ctx.restore();
    }

    /**
     * 获取社交图标 Canvas（使用预加载的图片）
     */
    getSocialIconCanvas(iconName, size) {
        const cacheKey = iconName + '_' + size;
        if (this.socialIconCanvasCache.has(cacheKey)) {
            return this.socialIconCanvasCache.get(cacheKey);
        }

        const img = this.socialIconImageCache.get(iconName);
        if (!img) return null;

        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // 保持比例缩放
        const scale = Math.min(size / img.width, size / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        const x = (size - w) / 2;
        const y = (size - h) / 2;

        ctx.drawImage(img, x, y, w, h);

        this.socialIconCanvasCache.set(cacheKey, canvas);
        return canvas;
    }

    /**
     * 绘制社交媒体图标（支持右上角和底部居中两种位置）
     */
    drawSocialIcons(ctx, config, width, height, templateId) {
        if (!config.hasSocialIcons || !config.selectedSocialIcons || config.selectedSocialIcons.length === 0) {
            return;
        }

        const icons = config.selectedSocialIcons;
        const iconSize = 20;
        const gap = 10;
        const totalWidth = icons.length * iconSize + (icons.length - 1) * gap;

        const position = config.socialIconPosition || 'top-right';
        let x, y;

        if (position === 'bottom-center') {
            const edgeMarginBottom = 20; // 进一步下移，贴近页面边缘
            x = (width - totalWidth) / 2;
            y = height - edgeMarginBottom;
        } else {
            const edgeMargin = 40;
            x = width - totalWidth - edgeMargin;
            y = edgeMargin + (iconSize / 2);
        }

        ctx.save();

        ctx.globalAlpha = 1.0;

        ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 1;

        icons.forEach((iconName, index) => {
            const iconX = Math.round(x + index * (iconSize + gap));
            const iconY = Math.round(y - iconSize / 2);
            const iconCanvas = this.getSocialIconCanvas(iconName, iconSize);
            if (iconCanvas) {
                ctx.drawImage(iconCanvas, iconX, iconY, iconSize, iconSize);
            }
        });

        ctx.restore();
    }
}

/**
 * TextSplitter - 智能文本分页器
 * 
 * 设计原则：
 * 1. 布局一致性：通过调用 TemplateDefinitions.getContentBox 确保分页逻辑与渲染逻辑共享相同的尺寸定义。
 * 2. 递归拆分：当一个块（如长段落）超过剩余空间时，递归地将其切分为多页，确保没有任何文本溢出。
 * 3. 语义化分页：支持 Markdown 分割线 (---) 作为强制分页符。
 */
class TextSplitter {
    constructor(config, templateId = 'polaroid') {
        this.config = config;
        this.templateId = templateId;
        this.engine = new CanvasTextEngine(config);
        this.calculateLayout();
        
        this.engine.updateConfig({
            ...config,
            drawWidth: this.contentWidth,
            maxBlockHeight: this.maxHeight
        });
    }

    /**
     * 更新配置并同步重算布局尺寸
     */
    updateConfig(config, templateId) {
        this.config = config;
        if (templateId) this.templateId = templateId;
        
        this.calculateLayout();
        this.engine.updateConfig({
            ...config,
            drawWidth: this.contentWidth,
            maxBlockHeight: this.maxHeight
        });
    }

    /**
     * 计算当前模板允许的最大内容高度和宽度
     */
    calculateLayout() {
        // 核心布局尺寸定义来自于 TemplateDefinitions
        const contentBox = TemplateDefinitions.getContentBox(
            this.templateId, this.config, PREVIEW_WIDTH, PREVIEW_HEIGHT
        );
        this.maxHeight = contentBox.height;
        this.contentWidth = contentBox.width;
    }

    /**
     * 执行分页算法
     */
    async split(text) {
        if (!text || !text.trim()) return [];
        if (typeof marked === 'undefined') {
            throw new Error('Markdown 解析库 (marked.js) 未加载，请检查网络或浏览器设置。');
        }

        // 确保自定义 Markdown 扩展（如高亮、居中）在 lexer 前被注册
        if (typeof MarkdownParser !== 'undefined' && typeof MarkdownParser.init === 'function') {
            MarkdownParser.init();
        }

        let tokens = [];
        try {
            tokens = marked.lexer(text);
        } catch (e) {
            console.error('[TextSplitter] Marked lexer failed:', e);
            throw new Error('Markdown 解析失败，请检查输入内容是否有特殊字符。');
        }
        
        const pages = [];
        
        // 1. 注入封面页
        if (this.config.hasCover) {
            let coverTitle = this.config.coverTitle;
            if (!coverTitle) {
                // 尝试从 tokens 中寻找第一个标题或第一行文字
                const firstContentToken = tokens.find(t => t.type === 'heading' || t.type === 'paragraph');
                if (firstContentToken) {
                    coverTitle = firstContentToken.text || firstContentToken.raw.split('\n')[0];
                }
            }
            pages.push([{
                type: 'cover',
                title: coverTitle || '未命名文档',
                image: this.config.coverImage
            }]);
        }

        let currentPage = { layouts: [], totalHeight: 0 };

        /**
         * 递归处理布局块，支持跨页拆分
         */
        const processLayout = (layout) => {
            const availableHeight = this.maxHeight - currentPage.totalHeight;

            // 情况 A：块能完全放入当前页
            if (layout.height <= availableHeight) {
                currentPage.layouts.push(layout);
                currentPage.totalHeight += layout.height;
                return;
            }

            // 情况 B：尝试拆分布局块（如将段落切分为前N行和剩余行）
            const splitResult = layout.type === 'table-grid'
                ? this.engine.splitTableLayout(layout, availableHeight)
                : this.engine.splitLayout(layout, availableHeight);
            
            if (splitResult) {
                const hadContentBeforeSplit = currentPage.layouts.length > 0;
                if (splitResult.part1 && splitResult.part1.height > 0) {
                    currentPage.layouts.push(splitResult.part1);
                }
                if (currentPage.layouts.length > 0) pages.push(currentPage.layouts);
                currentPage = { layouts: [], totalHeight: 0 };
                // 递归处理剩余部分
                if (splitResult.part1 || hadContentBeforeSplit) {
                    processLayout(splitResult.part2);
                } else {
                    currentPage.layouts.push(layout);
                    currentPage.totalHeight += layout.height;
                }
            } else {
                // 情况 C：无法拆分（如单行标题过长或图片）
                if (currentPage.layouts.length > 0) {
                    pages.push(currentPage.layouts);
                    currentPage = { layouts: [], totalHeight: 0 };
                    processLayout(layout);
                } else {
                    // 即使新页面也放不下，强行放入防止死循环
                    currentPage.layouts.push(layout);
                    currentPage.totalHeight += layout.height;
                }
            }
        };

        for (const token of tokens) {
            if (token.type === 'hr') {
                if (currentPage.layouts.length > 0) {
                    pages.push(currentPage.layouts);
                    currentPage = { layouts: [], totalHeight: 0 };
                }
                continue;
            }

            const layouts = await this.engine.layoutToken(token);
            for (const layout of layouts) {
                processLayout(layout);
            }
        }

        if (currentPage.layouts.length > 0) {
            pages.push(currentPage.layouts);
        }

        return pages;
    }
}

const templateConfig={"coverImage": "assets/cover-minimalist-magazine.jpg", "coverFontSize": 48, "bgColor": "#FFFFFF", "textColor": "#1A1A1A", "fontSize": 17, "lineHeight": 1.7, "letterSpacing": 0.3, "textPadding": 45, "fontFamily": "'Noto Serif SC', serif", "hasWatermark": false, "watermarkText": "极客狐", "watermarkColor": "rgba(0,0,0,0.03)", "hasSignature": true, "signatureText": "极客狐", "signatureColor": "#1A1A1A", "signaturePosition": "bottom", "signatureStyle": "elegant-serif", "h1Scale": 1.6, "h2Scale": 1.4, "h3Scale": 1.2, "accentColor": "#1A1A1A", "showPageNumber": true};

globalThis.XrcXhsCards = { async render(text) {
 const config = { bgColor:'#fff', textColor:'#333', fontSize:16, lineHeight:1.8, letterSpacing:0.5, textPadding:40, fontFamily:'"PingFang SC", sans-serif', h1Scale:1.6,h2Scale:1.4,h3Scale:1.2, ...templateConfig, hasCover:false, hasSignature:false, hasWatermark:false, hasSocialIcons:false, showPageNumber:true };
 if (/!\[[^\]]*\]\(|<img\b/i.test(text)) throw new Error("调试图文仅支持本地文字排版，请移除外部图片引用");
 const pages = await new TextSplitter(config, 'minimalist-magazine').split(text);
 if (!pages.length || pages.length > 4) throw new Error('图文需要 1～4 张卡片，请缩短正文后重试');
 const renderer = new CanvasRenderer(); const images = [];
 for (let index=0;index<pages.length;index++) {
  const canvas = await renderer.render({layouts:pages[index],index,totalCount:pages.length,config,templateId:'minimalist-magazine',width:PREVIEW_WIDTH,height:PREVIEW_HEIGHT,scale:OUTPUT_WIDTH/PREVIEW_WIDTH});
  images.push(canvas.toDataURL('image/png')); canvas.width=canvas.height=0;
 }
 return images;
}};
})();
