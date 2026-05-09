# CASE STUDY TITLE

@description 문제 정의부터 결과까지 보여주는 케이스스터디입니다.
@slug works/case-study-slug
@public
@cover ./cover.svg
@thumb ./thumb.svg

@work type=system status=published year=2026 featured=true weight=1
@role UX Designer, Frontend Developer
@stack Vue3, Vite, TypeScript
@tools Figma, GitHub Actions
@tags case-study, ui-ux, system-design

<!-- Supported from commit 05: @summary, @problem, @decision, @solution, @process, @result -->
@summary
이 케이스스터디의 요약입니다.
@end

@problem
문제 상황을 작성합니다.
@end

@decision
중요한 선택과 판단 기준을 작성합니다.
@end

@solution
해결 구조를 작성합니다.
@end

@process
작업 과정과 시행착오를 작성합니다.
@end

<!-- Supported from commit 06: @image, @compare, @video -->
@image ./gallery-01.svg "대표 화면" tag=필수
대표 화면 설명을 작성합니다.
@end

@compare before=./before.webp after=./after.webp initial=50
전후 비교 설명을 작성합니다.
@end

@video ./demo.webm poster=./poster.svg title="데모 영상" muted=true controls=true
영상 설명을 작성합니다.
@end

<!-- Supported from commit 07: @gallery, @item, @related, @metric, block-form @tools -->
@metric "핵심 지표" value=1 unit=system label="완성된 구조"
이 작업에서 드러나는 대표 성과를 작성합니다.
@end

@gallery "작업 화면" columns=2 variant=framed
@item ./gallery-01.svg "첫 번째 화면" label=01
@item ./gallery-02.svg "두 번째 화면" label=02
@end



<!-- Supported from commit 08: @title, @columns, @box, @note, @tip, @warning, @section-gap, @section-break -->
@title "구조와 판단" kicker=CASE subtitle="문제와 해결을 나란히 비교합니다." as=h2 align=left

@note 작성 기준
이 케이스스터디는 Easy Markdown 문법으로 작성한 뒤 정식 index.md로 컴파일됩니다.
@end


@danger "실패 가능성"
실제 손실이나 실패 가능성이 있는 상태를 강조할 때 사용합니다.
@end

@decision-box "선택 기준"
이 작업에서 구조적으로 선택한 기준을 짧게 정리합니다.
@end

@columns 2 gap=md collapse=mobile
@col 문제
핵심 문제를 짧게 정리합니다.

@col 해결
해결 구조를 짧게 정리합니다.
@end
