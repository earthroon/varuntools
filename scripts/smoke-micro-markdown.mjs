#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import process from 'node:process';

const rootDir = process.cwd();
const fixtureDir = path.join(rootDir, 'src', 'content', 'pages', 'works', '__micro-smoke__');

function run(args, options = {}) {
  const result = spawnSync(process.execPath, args, {
    cwd: rootDir,
    encoding: 'utf8',
    ...options,
  });
  return result;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function writeFixture() {
  fs.rmSync(fixtureDir, { recursive: true, force: true });
  fs.mkdirSync(path.join(fixtureDir, 'images'), { recursive: true });
  fs.mkdirSync(path.join(fixtureDir, 'videos'), { recursive: true });

  fs.writeFileSync(path.join(fixtureDir, 'cover.svg'), '<svg xmlns="http://www.w3.org/2000/svg"></svg>\n');
  fs.writeFileSync(path.join(fixtureDir, 'thumb.svg'), '<svg xmlns="http://www.w3.org/2000/svg"></svg>\n');
  fs.writeFileSync(path.join(fixtureDir, 'images', 'before.webp'), 'placeholder\n');
  fs.writeFileSync(path.join(fixtureDir, 'images', 'after.webp'), 'placeholder\n');
  fs.writeFileSync(path.join(fixtureDir, 'images', 'cover.webp'), 'placeholder\n');
  fs.writeFileSync(path.join(fixtureDir, 'images', 'poster.webp'), 'placeholder\n');
  fs.writeFileSync(path.join(fixtureDir, 'images', 'list.webp'), 'placeholder\n');
  fs.writeFileSync(path.join(fixtureDir, 'images', 'detail.webp'), 'placeholder\n');
  fs.writeFileSync(path.join(fixtureDir, 'images', 'detail-thumb.webp'), 'placeholder\n');
  fs.writeFileSync(path.join(fixtureDir, 'videos', 'out.webm'), 'placeholder\n');

  fs.writeFileSync(path.join(fixtureDir, 'work.micro.md'), `@H1_Micro Smoke Test
@DESC_Micro Markdown smoke fixture.
@SLUG_works/__micro-smoke__
@PUBLIC
@COVER=./cover.svg
@THUMB=./thumb.svg
@WORK_type=system,status=published,year=2026,featured=false
@STACK_Vue3, Vite, TypeScript

@SUM_
Micro summary body.

@PROB_
Micro problem body.

@SOL_
Micro solution body.

@SSOT_작성 기준|collapse=true
이 문서의 원본은 work.micro.md입니다.

@WARN_덮어쓰기 주의|collapse=false
GENERATED marker 없는 index.md는 자동으로 덮어쓰지 않습니다.

@BA=./images/before.webp|./images/after.webp|50|전후 비교

@WIPE=./images/before.webp|./images/after.webp|색감 비교

@V=./videos/out.webm|출력 데모 영상|poster=./images/poster.webp,muted=true,controls=true

@IMG=./images/cover.webp|대표 이미지|tag=필수
이미지 설명입니다.

@DEMO=sample-canvas|Sample Canvas|autoResize=true,minHeight=360,maxHeight=960

@TITLE_구조와 판단|kicker=VARUNTOOLS,subtitle=문제와 해결을 비교합니다,as=h2

@COLS_2|gap=md,collapse=mobile
@COL_문제
작업물이 늘어날수록 페이지 생성과 링크 관리가 귀찮아졌다.

@COL_해결
작성 문법, 생성기, 검증기, 배포 루틴을 하나로 묶었다.

@GAL_작업 화면|columns=2,variant=framed
@ITEM=./images/list.webp|Works 목록|label=01
@ITEM=./images/detail.webp|상세 페이지|thumb=./images/detail-thumb.webp,label=02

@METRIC_작성 루트|value=3,unit=paths,label=Manual / Easy / Micro
세 가지 작성 흐름을 지원합니다.

@TOOLSTACK_
stack: Vue3, Vite, TypeScript
tools: GitHub Actions, Markdown-it
runtime: GitHub Pages

@REL_wiper,varuntools-showroom

@GAP_lg
@BR_다음 장|variant=soft

@DANGER_실패 가능성
실패 가능성을 강조합니다.

@DECBOX_선택 기준
선택 기준 박스입니다.

@QUOTE_기록
기록 박스입니다.

@RES_
Micro result body.
`);
}

try {
  writeFixture();

  const compile = run(['scripts/compile-micro-markdown.mjs', '--write']);
  assert(compile.status === 0, `micro compile failed\nSTDOUT:\n${compile.stdout}\nSTDERR:\n${compile.stderr}`);

  const easyPath = path.join(fixtureDir, 'work.easy.md');
  const indexPath = path.join(fixtureDir, 'index.md');
  assert(fs.existsSync(easyPath), 'work.easy.md was not generated.');
  assert(fs.existsSync(indexPath), 'index.md was not generated.');

  const easy = fs.readFileSync(easyPath, 'utf8');
  assert(easy.includes('GENERATED FROM work.micro.md.'), 'work.easy.md is missing the Micro generated marker.');
  assert(easy.includes('# Micro Smoke Test'), 'heading shorthand was not compiled.');
  assert(easy.includes('@description Micro Markdown smoke fixture.'), 'description shorthand was not compiled.');
  assert(easy.includes('@summary\nMicro summary body.\n@end'), 'summary shorthand was not compiled.');
  assert(easy.includes('@compare before=./images/before.webp after=./images/after.webp initial=50'), 'before-after shorthand was not compiled.');
  assert(easy.includes('@compare before=./images/before.webp after=./images/after.webp\n색감 비교'), 'WIPE alias was not compiled.');
  assert(easy.includes('@video ./videos/out.webm title="출력 데모 영상" poster=./images/poster.webp muted=true controls=true'), 'video shorthand was not compiled.');
  assert(easy.includes('@demo sample-canvas title="Sample Canvas" autoResize=true minHeight=360 maxHeight=960'), 'demo shorthand was not compiled.');
  assert(easy.includes('@ssot "작성 기준" collapsible=true defaultOpen=true'), 'SSOT callout shorthand was not compiled.');
  assert(easy.includes('@warning "덮어쓰기 주의" collapsible=true defaultOpen=false'), 'warning collapse shorthand was not compiled.');
  assert(easy.includes('@decision-box "선택 기준"'), 'decision-box shorthand was not compiled.');
  assert(easy.includes('@quote-box "기록"'), 'quote-box shorthand was not compiled.');
  assert(easy.includes('@title "구조와 판단" kicker=VARUNTOOLS subtitle="문제와 해결을 비교합니다" as=h2'), 'TITLE shorthand was not compiled.');
  assert(easy.includes('@columns 2 gap=md collapse=mobile'), 'COLS shorthand was not compiled.');
  assert(easy.includes('@col 문제'), 'COL shorthand was not compiled.');
  assert(easy.includes('@gallery "작업 화면" columns=2 variant=framed'), 'GAL shorthand was not compiled.');
  assert(easy.includes('@item ./images/list.webp "Works 목록" label=01'), 'ITEM shorthand was not compiled.');
  assert(easy.includes('@item ./images/detail.webp "상세 페이지" thumb=./images/detail-thumb.webp label=02'), 'ITEM options were not compiled.');
  assert(easy.includes('@metric "작성 루트" value=3 unit=paths label="Manual / Easy / Micro"'), 'METRIC shorthand was not compiled.');
  assert(easy.includes('@tools\nstack: Vue3, Vite, TypeScript'), 'TOOLSTACK shorthand was not compiled.');
  assert(easy.includes('@related\n- wiper\n- varuntools-showroom\n@end'), 'REL shorthand was not compiled.');
  assert(easy.includes('@section-gap size=lg'), 'GAP shorthand was not compiled.');
  assert(easy.includes('@section-break label="다음 장" variant=soft'), 'BR shorthand was not compiled.');

  const index = fs.readFileSync(indexPath, 'utf8');
  assert(index.includes('::before-after'), 'index.md is missing before-after directive output.');
  assert(index.includes('::video-player'), 'index.md is missing video directive output.');
  assert(index.includes('::demo-frame'), 'index.md is missing demo-frame directive output.');
  assert(index.includes('type: ssot'), 'index.md is missing SSOT markdown-box output.');
  assert(index.includes('type: decision'), 'index.md is missing decision markdown-box output.');
  assert(index.includes('::case-gallery'), 'index.md is missing case-gallery directive output.');
  assert(index.includes('::metric-card'), 'index.md is missing metric-card directive output.');
  assert(index.includes('::tool-stack'), 'index.md is missing tool-stack directive output.');
  assert(index.includes('::related-works'), 'index.md is missing related-works directive output.');
  assert(index.includes('::editorial-title'), 'index.md is missing editorial-title directive output.');
  assert(index.includes('::editorial-columns'), 'index.md is missing editorial-columns directive output.');

  const check = run(['scripts/compile-micro-markdown.mjs', '--check']);
  assert(check.status === 0, `micro check failed\nSTDOUT:\n${check.stdout}\nSTDERR:\n${check.stderr}`);

  fs.appendFileSync(easyPath, '\n<!-- stale -->\n');
  const stale = run(['scripts/compile-micro-markdown.mjs', '--check']);
  assert(stale.status !== 0, 'micro check should fail when generated Easy Markdown is stale.');
  assert(`${stale.stdout}\n${stale.stderr}`.includes('MICRO007'), 'stale check did not report MICRO007.');

  const restore = run(['scripts/compile-micro-markdown.mjs', '--write']);
  assert(restore.status === 0, 'micro compile did not restore stale Easy Markdown.');



  const scaffoldWorkDir = path.join(rootDir, 'src', 'content', 'pages', 'works', 'micro-scaffold-work');
  const scaffoldPageDir = path.join(rootDir, 'src', 'content', 'pages', 'guide', 'micro-scaffold-page');
  fs.rmSync(scaffoldWorkDir, { recursive: true, force: true });
  fs.rmSync(scaffoldPageDir, { recursive: true, force: true });

  const scaffoldWork = run([
    'scripts/new-page.mjs',
    'works',
    'micro-scaffold-work',
    '--micro',
    '--title',
    'Micro Scaffold Work',
    '--status',
    'published',
    '--type',
    'system',
    '--featured',
  ]);
  assert(scaffoldWork.status === 0, `new work micro scaffold failed\nSTDOUT:\n${scaffoldWork.stdout}\nSTDERR:\n${scaffoldWork.stderr}`);
  assert(fs.existsSync(path.join(scaffoldWorkDir, 'work.micro.md')), 'work.micro.md was not scaffolded.');
  assert(fs.existsSync(path.join(scaffoldWorkDir, 'work.easy.md')), 'work.easy.md was not generated by scaffold.');
  assert(fs.existsSync(path.join(scaffoldWorkDir, 'index.md')), 'index.md was not generated by scaffold.');
  assert(fs.existsSync(path.join(scaffoldWorkDir, 'cover.svg')), 'cover.svg was not scaffolded.');
  assert(fs.existsSync(path.join(scaffoldWorkDir, 'thumb.svg')), 'thumb.svg was not scaffolded.');
  assert(fs.existsSync(path.join(scaffoldWorkDir, 'images', '.gitkeep')), 'images/.gitkeep was not scaffolded.');
  assert(fs.existsSync(path.join(scaffoldWorkDir, 'videos', '.gitkeep')), 'videos/.gitkeep was not scaffolded.');
  assert(fs.readFileSync(path.join(scaffoldWorkDir, 'work.easy.md'), 'utf8').includes('GENERATED FROM work.micro.md.'), 'scaffolded work.easy.md is missing generated marker.');

  const duplicateWork = run(['scripts/new-page.mjs', 'works', 'micro-scaffold-work', '--micro', '--title', 'Duplicate']);
  assert(duplicateWork.status !== 0, 'new work micro scaffold should fail when target directory already exists.');

  const scaffoldPage = run([
    'scripts/new-page.mjs',
    'guide',
    'micro-scaffold-page',
    '--micro',
    '--title',
    'Micro Scaffold Page',
  ]);
  assert(scaffoldPage.status === 0, `new page micro scaffold failed\nSTDOUT:\n${scaffoldPage.stdout}\nSTDERR:\n${scaffoldPage.stderr}`);
  assert(fs.existsSync(path.join(scaffoldPageDir, 'page.micro.md')), 'page.micro.md was not scaffolded.');
  assert(fs.existsSync(path.join(scaffoldPageDir, 'page.easy.md')), 'page.easy.md was not generated by scaffold.');
  assert(fs.existsSync(path.join(scaffoldPageDir, 'index.md')), 'page index.md was not generated by scaffold.');

  const checkAfterScaffold = run(['scripts/compile-micro-markdown.mjs', '--check']);
  assert(checkAfterScaffold.status === 0, `micro check failed after scaffold\nSTDOUT:\n${checkAfterScaffold.stdout}\nSTDERR:\n${checkAfterScaffold.stderr}`);

  fs.rmSync(scaffoldWorkDir, { recursive: true, force: true });
  fs.rmSync(scaffoldPageDir, { recursive: true, force: true });

  console.log('Micro Markdown smoke passed.');
} finally {
  fs.rmSync(fixtureDir, { recursive: true, force: true });
  fs.rmSync(path.join(rootDir, 'src', 'content', 'pages', 'works', 'micro-scaffold-work'), { recursive: true, force: true });
  fs.rmSync(path.join(rootDir, 'src', 'content', 'pages', 'guide', 'micro-scaffold-page'), { recursive: true, force: true });
}
