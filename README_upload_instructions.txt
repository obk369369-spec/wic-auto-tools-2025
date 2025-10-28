파일 교체 안내 (간단)
1) 이 deno.jsonc 파일을 현재 플랫폼의 루트(deno.jsonc 위치)에 업로드(대체)하세요.
   파일: deno.jsonc

2) 플랫폼이 '업로드 시 자동 재시작(auto_run_on_deploy)'으로 설정돼 있으면
   업로드만으로 바로 반영됩니다.

3) 자동 반영이 꺼져 있다면 운영자에게 아래 두 명령을 실행하도록 요청하세요:
   curl -X POST "https://wic-auto-tools-2025.obk369369-spec.deno.net/ops/bootstrap"
   curl -X POST "https://wic-auto-tools-2025.obk369369-spec.deno.net/ops/update"

4) 교체 후 아래 주소를 열어 정상 응답(OK)이 뜨면 완료입니다.
   https://wic-auto-tools-2025.obk369369-spec.deno.net/report/live
   https://wic-auto-tools-2025.obk369369-spec.deno.net/portal/launcher

주의:
- 이 파일은 기존 deno.jsonc의 env 설정만 교체하는 용도입니다.
- 다른 설정이 있다면 병합 후 업로드하세요.
