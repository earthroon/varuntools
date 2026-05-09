#!/usr/bin/env node
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { compileEasyMarkdownSource } from './lib/easy-markdown/compiler.mjs';
import { checkEasyMarkdownSurface, hasErrors } from './lib/easy-markdown/diagnostics.mjs';
import { createFileSystem, findEasyMarkdownTargets } from './lib/easy-markdown/files.mjs';
import { scaffoldEasyPage } from './lib/easy-markdown/scaffold.mjs';

function write(filePath, contents) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents, 'utf8');
}

function createTempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'varuntools-easy-smoke-'));
}

function createTarget(slug, kind = 'work') {
  const fileName = kind === 'work' ? 'work.easy.md' : 'page.easy.md';

  return {
    sourcePath: `src/content/pages/works/${slug}/${fileName}`,
    outputPath: `src/content/pages/works/${slug}/index.md`,
    kind,
    dir: `src/content/pages/works/${slug}`,
  };
}

function assertNoErrorDiagnostics(compiled) {
  assert.equal(compiled.diagnostics.filter((d) => d.severity !== 'warning').length, 0);
}

function runValidFrontmatterSmoke(root) {
  const sourcePath = path.join(root, 'src/content/pages/works/valid/work.easy.md');
  write(sourcePath, `# VARUNTOOLS\n\n@description Vue3 + Vite portfolio system.\n@slug works/varuntools\n@public\n@cover ./cover.svg\n@thumb ./thumb.svg\n@work type=system status=published year=2026 featured=true weight=1\n@role Designer, Developer\n@stack Vue3, Vite, TypeScript\n@tools GitHub Actions, Markdown-it\n@tags portfolio, cms, markdown\n`);

  const [target] = findEasyMarkdownTargets({ rootDir: root });
  const source = fs.readFileSync(path.join(root, target.sourcePath), 'utf8');
  const compiled = compileEasyMarkdownSource(source, target);

  assertNoErrorDiagnostics(compiled);
  assert.match(compiled.output, /GENERATED FROM work\.easy\.md/);
  assert.match(compiled.output, /title: "VARUNTOOLS"/);
  assert.match(compiled.output, /slug: "works\/varuntools"/);
  assert.match(compiled.output, /status: "active"/);
  assert.match(compiled.output, /visibility: "public"/);
  assert.match(compiled.output, /year: 2026/);
  assert.match(compiled.output, /featured: true/);
  assert.match(compiled.output, /- "Vue3"/);
}

function runCaseSectionSmoke() {
  const target = createTarget('case-sections');
  const compiled = compileEasyMarkdownSource(`# Test Work\n\n@description 테스트 설명\n@public\n@work type=system status=published year=2026\n\n@summary\n요약입니다.\n@end\n\n@problem axis=workflow\n문제입니다.\n@end\n\n@decision tone=technical\n판단입니다.\n@end\n\n@solution\n해결입니다.\n@end\n\n@process\n과정입니다.\n@end\n\n@result\n결과입니다.\n@end\n`, target);

  assertNoErrorDiagnostics(compiled);
  assert.match(compiled.output, /::work-summary\n::\n요약입니다\.\n::/);
  assert.match(compiled.output, /::case-section\ntype: problem\ntitle: 문제\naxis: workflow\n::\n문제입니다\.\n::/);
  assert.match(compiled.output, /::case-section\ntype: decision\ntitle: 판단\ntone: technical\n::\n판단입니다\.\n::/);
  assert.match(compiled.output, /::case-section\ntype: solution\ntitle: 해결\n::\n해결입니다\.\n::/);
  assert.match(compiled.output, /::case-section\ntype: process\ntitle: 과정\n::\n과정입니다\.\n::/);
  assert.match(compiled.output, /::case-section\ntype: result\ntitle: 결과\n::\n결과입니다\.\n::/);
}

function runTitleOverrideSmoke() {
  const target = createTarget('title-override');
  const compiled = compileEasyMarkdownSource(`# Test Work\n\n@description 테스트 설명\n@public\n@work type=system status=published year=2026\n\n@problem title="작성 병목"\n본문입니다.\n@end\n`, target);

  assertNoErrorDiagnostics(compiled);
  assert.match(compiled.output, /type: problem\ntitle: 작성 병목\n::\n본문입니다\./);
}

function runUnclosedBlockSmoke() {
  const target = createTarget('unclosed');
  const compiled = compileEasyMarkdownSource(`# Test Work\n\n@description 테스트 설명\n@public\n@work type=system status=published year=2026\n\n@problem\n닫히지 않은 본문\n`, target);

  assert.ok(compiled.diagnostics.some((diagnostic) => diagnostic.code === 'EASY005'));
}

function runStrayEndSmoke() {
  const target = createTarget('stray-end');
  const compiled = compileEasyMarkdownSource(`# Test Work\n\n@description 테스트 설명\n@end\n`, target);

  assert.ok(compiled.diagnostics.some((diagnostic) => diagnostic.code === 'EASY017'));
}

function runNestedBlockSmoke() {
  const target = createTarget('nested');
  const compiled = compileEasyMarkdownSource(`# Test Work\n\n@description 테스트 설명\n\n@problem\n문제입니다.\n@solution\n해결입니다.\n@end\n`, target);

  assert.ok(compiled.diagnostics.some((diagnostic) => diagnostic.code === 'EASY018'));
}


function runMediaBlockSmoke() {
  const target = createTarget('media-blocks');
  const compiled = compileEasyMarkdownSource(`# Test Work

@description 테스트 설명
@public
@work type=system status=published year=2026

@image ./images/cover.webp "대표 이미지" tag=필수
대표 이미지 설명입니다.
@end

@compare before=./images/before.webp after=./images/after.webp initial=50
전후 비교 설명입니다.
@end

@video ./videos/demo.webm poster=./images/poster.webp title="데모 영상" muted=true controls=true
작동 흐름입니다.
@end
`, target);

  assertNoErrorDiagnostics(compiled);
  assert.match(compiled.output, /::captioned-image\nsrc: \.\/images\/cover\.webp\nalt: 대표 이미지\ncaption: 대표 이미지 설명입니다\.\ntag: 필수\n::/);
  assert.match(compiled.output, /::before-after\nbefore: \.\/images\/before\.webp\nafter: \.\/images\/after\.webp\ninitial: 50\ncaption: 전후 비교 설명입니다\.\n::/);
  assert.match(compiled.output, /::video-player\nsrc: \.\/videos\/demo\.webm\ncaption: 작동 흐름입니다\.\nposter: \.\/images\/poster\.webp\ntitle: 데모 영상\nmuted: true\ncontrols: true\n::/);
}

function runInvalidCompareInitialSmoke() {
  const target = createTarget('invalid-compare-initial');
  const compiled = compileEasyMarkdownSource(`# Test Work

@description 테스트 설명
@public
@work type=system status=published year=2026

@compare before=./images/before.webp after=./images/after.webp initial=abc
전후 비교 설명입니다.
@end
`, target);

  assert.ok(compiled.diagnostics.some((diagnostic) => diagnostic.code === 'EASY024'));
}

function runMissingVideoSourceSmoke() {
  const target = createTarget('missing-video-source');
  const compiled = compileEasyMarkdownSource(`# Test Work

@description 테스트 설명
@public
@work type=system status=published year=2026

@video poster=./images/poster.webp title="데모 영상"
작동 흐름입니다.
@end
`, target);

  assert.ok(compiled.diagnostics.some((diagnostic) => diagnostic.code === 'EASY025'));
}

function runInvalidVideoBooleanSmoke() {
  const target = createTarget('invalid-video-boolean');
  const compiled = compileEasyMarkdownSource(`# Test Work

@description 테스트 설명
@public
@work type=system status=published year=2026

@video ./videos/demo.webm muted=yes
작동 흐름입니다.
@end
`, target);

  assert.ok(compiled.diagnostics.some((diagnostic) => diagnostic.code === 'EASY014'));
}


function runPortfolioBlocksSmoke() {
  const target = createTarget('portfolio-blocks');
  const compiled = compileEasyMarkdownSource(`# Test Work

@description 테스트 설명
@public
@work type=system status=published year=2026

@gallery "작업 화면" columns=2 variant=framed
caption: 대표 화면과 출력 예시

@item ./images/list.webp "Works 목록" label=01
@item ./images/detail.webp "상세 페이지" thumb=./images/detail-thumb.webp label=02 alt="상세 대체 텍스트"
@end

@related
- markdown-gallery-lab
- wiper
@end

@metric "작성 루트" value=3 unit=paths label="Manual / CSV / Easy Markdown"
세 가지 작성 흐름을 지원합니다.
@end

@tools
stack: Vue3, Vite, TypeScript
tools: GitHub Actions, Markdown-it
runtime: GitHub Pages
@end
`, target);

  assertNoErrorDiagnostics(compiled);
  assert.match(compiled.output, /::case-gallery\ntitle: 작업 화면\ncaption: 대표 화면과 출력 예시\ncolumns: 2\nvariant: framed\n::\n- \.\/images\/list\.webp \| Works 목록 \|  \| alt=Works 목록; label=01/);
  assert.match(compiled.output, /- \.\/images\/detail\.webp \| 상세 페이지 \| \.\/images\/detail-thumb\.webp \| alt=상세 대체 텍스트; label=02/);
  assert.match(compiled.output, /::related-works\nitems-json: \["markdown-gallery-lab","wiper"\]\n::/);
  assert.match(compiled.output, /::metric-card\ntitle: 작성 루트\nvalue: 3\nunit: paths\nlabel: Manual \/ CSV \/ Easy Markdown\n::\n세 가지 작성 흐름을 지원합니다\.\n::/);
  assert.match(compiled.output, /::tool-stack\nstack-json: \["Vue3","Vite","TypeScript"\]\ntools-json: \["GitHub Actions","Markdown-it"\]\nruntime-json: \["GitHub Pages"\]\n::/);
}

function runGalleryWithoutItemsSmoke() {
  const target = createTarget('empty-gallery');
  const compiled = compileEasyMarkdownSource(`# Test Work

@description 테스트 설명
@public
@work type=system status=published year=2026

@gallery "빈 갤러리" columns=2
@end
`, target);

  assert.ok(compiled.diagnostics.some((diagnostic) => diagnostic.code === 'EASY031'));
}

function runInvalidGalleryColumnsSmoke() {
  const target = createTarget('invalid-gallery-columns');
  const compiled = compileEasyMarkdownSource(`# Test Work

@description 테스트 설명
@public
@work type=system status=published year=2026

@gallery "갤러리" columns=abc
@item ./images/list.webp "Works 목록"
@end
`, target);

  assert.ok(compiled.diagnostics.some((diagnostic) => diagnostic.code === 'EASY032'));
}

function runMetricWithoutTitleSmoke() {
  const target = createTarget('metric-without-title');
  const compiled = compileEasyMarkdownSource(`# Test Work

@description 테스트 설명
@public
@work type=system status=published year=2026

@metric value=3 unit=paths
내용입니다.
@end
`, target);

  assert.ok(compiled.diagnostics.some((diagnostic) => diagnostic.code === 'EASY034'));
}


function runEditorialBlocksSmoke() {
  const target = createTarget('editorial-blocks');
  const compiled = compileEasyMarkdownSource(`# Editorial Test

@description 편집 레이아웃 테스트입니다.
@public
@work type=system status=published year=2026

@title "구조와 판단" kicker=TEST subtitle="문제와 해결을 비교합니다." as=h2 align=left

@columns 2 gap=md collapse=mobile
@col 문제
문제 설명입니다.

@col 해결
해결 설명입니다.
@end

@box ssot "기준"
Easy Markdown의 원본은 work.easy.md입니다.
@end

@note 참고
이것은 참고 박스입니다.
@end

@section-gap size=lg

@section-break label="다음 장" tone=quiet
`, target);

  assertNoErrorDiagnostics(compiled);
  assert.match(compiled.output, /::editorial-title\ntitle: 구조와 판단\nkicker: TEST\nsubtitle: 문제와 해결을 비교합니다\.\nas: h2\nalign: left\n::/);
  assert.match(compiled.output, /::editorial-columns\ncols: 2\ngap: md\ncollapse: mobile\n::\n### 문제\n\n문제 설명입니다\.\n\n---\n\n### 해결\n\n해결 설명입니다\.\n::/);
  assert.match(compiled.output, /::markdown-box\ntype: ssot\ntitle: 기준\n::\nEasy Markdown의 원본은 work\.easy\.md입니다\.\n::/);
  assert.match(compiled.output, /::markdown-box\ntype: note\ntitle: 참고\n::\n이것은 참고 박스입니다\.\n::/);
  assert.match(compiled.output, /::section-gap\nsize: lg\n::/);
  assert.match(compiled.output, /::section-break\nlabel: 다음 장\ntone: quiet\n::/);
}

function runColumnsWithoutColSmoke() {
  const target = createTarget('columns-without-col');
  const compiled = compileEasyMarkdownSource(`# Test Work

@description 테스트 설명
@public
@work type=system status=published year=2026

@columns 2
본문입니다.
@end
`, target);

  assert.ok(compiled.diagnostics.some((diagnostic) => diagnostic.code === 'EASY043'));
}

function runColOutsideColumnsSmoke() {
  const target = createTarget('col-outside-columns');
  const compiled = compileEasyMarkdownSource(`# Test Work

@description 테스트 설명
@public
@work type=system status=published year=2026

@col 문제
본문입니다.
`, target);

  assert.ok(compiled.diagnostics.some((diagnostic) => diagnostic.code === 'EASY046'));
}

function runInvalidEditorialTitleSmoke() {
  const target = createTarget('invalid-editorial-title');
  const compiled = compileEasyMarkdownSource(`# Test Work

@description 테스트 설명
@public
@work type=system status=published year=2026

@title as=h9 align=right
`, target);

  assert.ok(compiled.diagnostics.some((diagnostic) => diagnostic.code === 'EASY040'));
  assert.ok(compiled.diagnostics.some((diagnostic) => diagnostic.code === 'EASY041'));
  assert.ok(compiled.diagnostics.some((diagnostic) => diagnostic.code === 'EASY042'));
}


function runCalloutBoxShortcutSmoke() {
  const target = createTarget('callout-box-shortcuts');
  const compiled = compileEasyMarkdownSource(`# Test Work

@description 테스트 설명
@public
@work type=system status=published year=2026

@ssot "SSOT 기준" tone=calm collapsible=true defaultOpen=true
상태 귀속 위치를 명시합니다.
@end

@danger "Danger"
실제 실패나 손실 가능성이 있는 상태를 강조합니다.
@end

@quote-box "기록"
문장의 리듬을 보존하는 박스입니다.
@end

@decision-box "선택 기준"
이 구조를 선택한 이유를 짧게 정리합니다.
@end

@warning "조용한 보정 금지" collapsible=true open=false
불명확한 값은 예쁘게 메우지 않고 warning으로 남깁니다.
@end

@box ssot "기준" tone=blue icon=◆
명시형 박스입니다.
@end

@decision
판단 서사입니다.
@end
`, target);

  assertNoErrorDiagnostics(compiled);
  assert.match(compiled.output, /::markdown-box\ntype: ssot\ntitle: SSOT 기준\ntone: calm\ncollapsible: true\ndefaultOpen: true\n::\n상태 귀속 위치를 명시합니다\.\n::/);
  assert.match(compiled.output, /::markdown-box\ntype: danger\ntitle: Danger\n::\n실제 실패나 손실 가능성이 있는 상태를 강조합니다\.\n::/);
  assert.match(compiled.output, /::markdown-box\ntype: quote\ntitle: 기록\n::\n문장의 리듬을 보존하는 박스입니다\.\n::/);
  assert.match(compiled.output, /::markdown-box\ntype: decision\ntitle: 선택 기준\n::\n이 구조를 선택한 이유를 짧게 정리합니다\.\n::/);
  assert.match(compiled.output, /::markdown-box\ntype: warning\ntitle: 조용한 보정 금지\ncollapsible: true\ndefaultOpen: false\n::\n불명확한 값은 예쁘게 메우지 않고 warning으로 남깁니다\.\n::/);
  assert.match(compiled.output, /::markdown-box\ntype: ssot\ntitle: 기준\ntone: blue\nicon: ◆\n::\n명시형 박스입니다\.\n::/);
  assert.match(compiled.output, /::case-section\ntype: decision\ntitle: 판단\n::\n판단 서사입니다\.\n::/);
}

function runInvalidCalloutBooleanSmoke() {
  const target = createTarget('invalid-callout-boolean');
  const compiled = compileEasyMarkdownSource(`# Test Work

@description 테스트 설명
@public
@work type=system status=published year=2026

@warning "주의" collapsible=maybe
본문입니다.
@end
`, target);

  assert.ok(compiled.diagnostics.some((diagnostic) => diagnostic.code === 'EASY047'));
}

function runMissingTitleSmoke() {
  const target = createTarget('missing-title');
  const compiled = compileEasyMarkdownSource('@description Missing title page.\n', target);

  assert.ok(compiled.diagnostics.some((diagnostic) => diagnostic.code === 'EASY001'));
}

function runInvalidYearSmoke() {
  const target = createTarget('invalid-year');
  const compiled = compileEasyMarkdownSource('# Invalid\n@description Bad year.\n@work year=soon featured=true\n', target);

  assert.ok(compiled.diagnostics.some((diagnostic) => diagnostic.code === 'EASY013'));
}

function runCollisionSmoke(root) {
  write(path.join(root, 'src/content/pages/works/collision/work.easy.md'), '# Collision\n@description Collision.\n');
  write(path.join(root, 'src/content/pages/works/collision/page.csv'), 'type,value\n');

  const targets = findEasyMarkdownTargets({ rootDir: root });
  const fsApi = createFileSystem(root);
  const diagnostics = checkEasyMarkdownSurface(targets, {
    exists: fsApi.exists,
    readFile: fsApi.readFile,
  });

  assert.ok(diagnostics.some((diagnostic) => diagnostic.code === 'EASY006'));
  assert.ok(hasErrors(diagnostics));
}


function compilerScriptPath() {
  return path.resolve('scripts/compile-easy-markdown.mjs');
}

function runCompiler(root, args, expectSuccess = true) {
  try {
    return execFileSync(process.execPath, [compilerScriptPath(), ...args], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (error) {
    const output = `${error.stdout || ''}${error.stderr || ''}`;

    if (expectSuccess) {
      throw new Error(`Expected Easy Markdown compiler to pass. Output:\n${output}`);
    }

    return output;
  }
}

function runStaleCheckSmoke() {
  const root = createTempRoot();

  try {
    write(path.join(root, 'src/content/pages/works/related/index.md'), `---\ntitle: Related\nslug: works/related\nstatus: active\nvisibility: public\nwork:\n  status: published\n---\n`);
    write(path.join(root, 'src/content/pages/works/easy/images/cover.webp'), 'fake image');
    write(path.join(root, 'src/content/pages/works/easy/work.easy.md'), `# Easy Work

@description Easy page.
@slug works/easy
@public
@cover ./images/cover.webp
@work type=system status=published year=2026

@related
- related
@end
`);

    runCompiler(root, ['--write']);
    runCompiler(root, ['--check']);

    const indexPath = path.join(root, 'src/content/pages/works/easy/index.md');
    const current = fs.readFileSync(indexPath, 'utf8');
    assert.match(current, /SOURCE HASH: sha256:[a-f0-9]{64}/);
    fs.writeFileSync(indexPath, `${current}\n<!-- manual drift -->\n`, 'utf8');

    const output = runCompiler(root, ['--check'], false);
    assert.match(output, /EASY007/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function runMissingGeneratedMarkerSmoke() {
  const root = createTempRoot();

  try {
    write(path.join(root, 'src/content/pages/works/manual/work.easy.md'), `# Manual Collision

@description Easy page.
@public
@work type=system status=published year=2026
`);
    write(path.join(root, 'src/content/pages/works/manual/index.md'), `---\ntitle: Manual\n---\nManual body\n`);

    const output = runCompiler(root, ['--check'], false);
    assert.match(output, /EASY010/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function runMissingAssetSmoke() {
  const root = createTempRoot();

  try {
    write(path.join(root, 'src/content/pages/works/missing-asset/work.easy.md'), `# Missing Asset

@description Missing asset page.
@public
@cover ./images/missing.webp
@work type=system status=published year=2026

@image ./images/also-missing.webp "Missing image"
Caption.
@end
`);

    const output = runCompiler(root, ['--write'], false);
    assert.match(output, /EASY008/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function runMissingRelatedSlugSmoke() {
  const root = createTempRoot();

  try {
    write(path.join(root, 'src/content/pages/works/easy/work.easy.md'), `# Missing Related

@description Missing related page.
@public
@work type=system status=published year=2026

@related
- does-not-exist
@end
`);

    const output = runCompiler(root, ['--write'], false);
    assert.match(output, /EASY009/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function runEasyMarkdownCoexistenceSmoke() {
  const root = createTempRoot();

  try {
    write(path.join(root, 'src/content/pages/works/coexist/work.easy.md'), '# Work\n@description Work.\n');
    write(path.join(root, 'src/content/pages/works/coexist/page.easy.md'), '# Page\n@description Page.\n');

    const output = runCompiler(root, ['--write'], false);
    assert.match(output, /EASY011/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function easyTemplateRoot() {
  return path.resolve('src/content/templates/easy');
}


function runDemoBlockSmoke() {
  const target = createTarget('demo-blocks');
  const compiled = compileEasyMarkdownSource(`# Demo Test

@description 데모 테스트입니다.
@public
@work type=system status=published year=2026

@demo sample-canvas title="Sample Canvas" ratio="16 / 10" fullscreen=false autoResize=true minHeight=360 maxHeight=960
iframe 기반 샘플 데모입니다.
@end

@demo src="demos/sample-canvas/index.html" title="Direct Sample"
직접 경로 데모입니다.
@end
`, target);

  assertNoErrorDiagnostics(compiled);
  assert.match(compiled.output, /::demo-frame\nid: sample-canvas\ntitle: Sample Canvas\nratio: 16 \/ 10\nallowFullscreen: false\nautoResize: true\nminHeight: 360\nmaxHeight: 960\n::\niframe 기반 샘플 데모입니다\.\n::/);
  assert.match(compiled.output, /::demo-frame\nsrc: demos\/sample-canvas\/index\.html\ntitle: Direct Sample\n::\n직접 경로 데모입니다\.\n::/);
}

function runMissingDemoIdentitySmoke() {
  const target = createTarget('demo-missing-id');
  const compiled = compileEasyMarkdownSource(`# Demo Test

@description 데모 테스트입니다.
@public
@work type=system status=published year=2026

@demo title="Missing Demo"
본문입니다.
@end
`, target);

  assert.ok(compiled.diagnostics.some((diagnostic) => diagnostic.code === 'EASY060'));
}

function runInvalidDemoBooleanSmoke() {
  const target = createTarget('demo-invalid-boolean');
  const compiled = compileEasyMarkdownSource(`# Demo Test

@description 데모 테스트입니다.
@public
@work type=system status=published year=2026

@demo sample-canvas fullscreen=maybe
본문입니다.
@end
`, target);

  assert.ok(compiled.diagnostics.some((diagnostic) => diagnostic.code === 'EASY014'));
}

function runInvalidDemoHeightSmoke() {
  const target = createTarget('demo-invalid-height');
  const compiled = compileEasyMarkdownSource(`# Demo Test

@description 데모 테스트입니다.
@public
@work type=system status=published year=2026

@demo sample-canvas minHeight=abc maxHeight=960
본문입니다.
@end
`, target);

  assert.ok(compiled.diagnostics.some((diagnostic) => diagnostic.code === 'EASY065'));
}

function runInvalidDemoHeightRangeSmoke() {
  const target = createTarget('demo-invalid-height-range');
  const compiled = compileEasyMarkdownSource(`# Demo Test

@description 데모 테스트입니다.
@public
@work type=system status=published year=2026

@demo sample-canvas minHeight=960 maxHeight=360
본문입니다.
@end
`, target);

  assert.ok(compiled.diagnostics.some((diagnostic) => diagnostic.code === 'EASY066'));
}

function runMissingDemoEntrySmoke() {
  const root = createTempRoot();

  try {
    const sourcePath = path.join(root, 'src/content/pages/works/demo-missing/work.easy.md');
    write(sourcePath, `# Demo Missing

@description 데모 엔트리 누락 테스트입니다.
@public
@work type=system status=published year=2026

@demo src="demos/missing/index.html" title="Missing Demo"
본문입니다.
@end
`);

    assert.throws(() => runCompiler(root, ['--write']), /EASY064/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function runScaffoldWorkSmoke() {
  const root = createTempRoot();

  try {
    const result = scaffoldEasyPage({
      rootDir: root,
      templateRoot: easyTemplateRoot(),
      section: 'works',
      slug: 'scaffold-work',
      title: 'Scaffold Work',
      status: 'published',
      year: 2026,
      type: 'system',
      featured: true,
    });

    assert.equal(result.sourcePath, 'src/content/pages/works/scaffold-work/work.easy.md');
    assert.ok(fs.existsSync(path.join(root, result.sourcePath)));
    assert.ok(fs.existsSync(path.join(root, result.outputPath)));
    assert.ok(fs.existsSync(path.join(root, 'src/content/pages/works/scaffold-work/cover.svg')));
    assert.ok(fs.existsSync(path.join(root, 'src/content/pages/works/scaffold-work/thumb.svg')));
    assert.ok(fs.existsSync(path.join(root, 'src/content/pages/works/scaffold-work/images/.gitkeep')));
    assert.ok(fs.existsSync(path.join(root, 'src/content/pages/works/scaffold-work/videos/.gitkeep')));
    runCompiler(root, ['--check']);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function runScaffoldPageSmoke() {
  const root = createTempRoot();

  try {
    const result = scaffoldEasyPage({
      rootDir: root,
      templateRoot: easyTemplateRoot(),
      section: 'guide',
      slug: 'markdown-guide',
      title: 'Markdown Guide',
      status: 'published',
      year: 2026,
    });

    assert.equal(result.sourcePath, 'src/content/pages/guide/markdown-guide/page.easy.md');
    assert.ok(fs.existsSync(path.join(root, result.sourcePath)));
    assert.ok(fs.existsSync(path.join(root, result.outputPath)));
    assert.ok(fs.existsSync(path.join(root, 'src/content/pages/guide/markdown-guide/cover.svg')));
    runCompiler(root, ['--check']);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function runScaffoldCaseStudySmoke() {
  const root = createTempRoot();

  try {
    const result = scaffoldEasyPage({
      rootDir: root,
      templateRoot: easyTemplateRoot(),
      section: 'works',
      slug: 'case-study-work',
      title: 'Case Study Work',
      template: 'case-study',
      status: 'published',
      year: 2026,
      featured: true,
    });

    assert.equal(result.sourcePath, 'src/content/pages/works/case-study-work/work.easy.md');
    assert.ok(fs.existsSync(path.join(root, result.sourcePath)));
    assert.ok(fs.existsSync(path.join(root, 'src/content/pages/works/case-study-work/gallery-01.svg')));
    assert.ok(fs.existsSync(path.join(root, 'src/content/pages/works/case-study-work/demo.webm')));
    runCompiler(root, ['--check']);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function runScaffoldExistingTargetSmoke() {
  const root = createTempRoot();

  try {
    scaffoldEasyPage({
      rootDir: root,
      templateRoot: easyTemplateRoot(),
      section: 'works',
      slug: 'duplicate',
      title: 'Duplicate',
    });

    assert.throws(() => scaffoldEasyPage({
      rootDir: root,
      templateRoot: easyTemplateRoot(),
      section: 'works',
      slug: 'duplicate',
      title: 'Duplicate',
    }), /EASY050/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function runScaffoldInvalidSlugSmoke() {
  const root = createTempRoot();

  try {
    assert.throws(() => scaffoldEasyPage({
      rootDir: root,
      templateRoot: easyTemplateRoot(),
      section: 'works',
      slug: '한글 슬러그',
      title: 'Invalid Slug',
    }), /EASY051/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

const root = createTempRoot();

try {
  runValidFrontmatterSmoke(root);
  runCaseSectionSmoke();
  runTitleOverrideSmoke();
  runUnclosedBlockSmoke();
  runStrayEndSmoke();
  runNestedBlockSmoke();
  runMediaBlockSmoke();
  runInvalidCompareInitialSmoke();
  runMissingVideoSourceSmoke();
  runInvalidVideoBooleanSmoke();
  runPortfolioBlocksSmoke();
  runGalleryWithoutItemsSmoke();
  runInvalidGalleryColumnsSmoke();
  runMetricWithoutTitleSmoke();
  runEditorialBlocksSmoke();
  runColumnsWithoutColSmoke();
  runColOutsideColumnsSmoke();
  runInvalidEditorialTitleSmoke();
  runCalloutBoxShortcutSmoke();
  runInvalidCalloutBooleanSmoke();
  runDemoBlockSmoke();
  runMissingDemoIdentitySmoke();
  runInvalidDemoBooleanSmoke();
  runInvalidDemoHeightSmoke();
  runInvalidDemoHeightRangeSmoke();
  runMissingDemoEntrySmoke();
  runMissingTitleSmoke();
  runInvalidYearSmoke();
  runCollisionSmoke(root);
  runStaleCheckSmoke();
  runMissingGeneratedMarkerSmoke();
  runMissingAssetSmoke();
  runMissingRelatedSlugSmoke();
  runEasyMarkdownCoexistenceSmoke();
  runScaffoldWorkSmoke();
  runScaffoldPageSmoke();
  runScaffoldCaseStudySmoke();
  runScaffoldExistingTargetSmoke();
  runScaffoldInvalidSlugSmoke();
  console.log('Easy Markdown smoke passed.');
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
