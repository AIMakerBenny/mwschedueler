#!/usr/bin/env bash
set -euo pipefail
[[ "${MWS_QA_OFFLINE:-}" == 1 ]] || exit 64
[[ $# -gt 0 ]] || exit 64
for bin in unshare ip setpriv readlink; do command -v "$bin" >/dev/null || exit 69; done
parent=$(readlink /proc/self/ns/net)
uid=$(id -u); gid=$(id -g); outer_path=$PATH
runner='set -euo pipefail
parent=$1; uid=$2; gid=$3; outer_path=$4; shift 4
[[ $(readlink /proc/self/ns/net) != "$parent" ]] || exit 77
ip link set lo up
[[ $(ip -o link show | wc -l) -eq 1 ]] || exit 77
[[ -z $(ip route show default) && -z $(ip -6 route show default) ]] || exit 77
echo MWS_LOCAL_NETWORK_ONLY_NAMESPACE_OK
exec setpriv --reuid "$uid" --regid "$gid" --init-groups -- env PATH="$outer_path" "$@"'
if [[ $uid == 0 ]]; then
  exec unshare --net -- bash -c "$runner" bash "$parent" "$uid" "$gid" "$outer_path" "$@"
else
  # Preserve QA configuration and browser-display variables, not credentials.
  keep=()
  while IFS= read -r key; do
    case "$key" in
      MWS_*TOKEN*|MWS_*SECRET*|MWS_*PASSWORD*|MWS_*API_KEY*) ;;
      MWS_*|CAREER_QA_*|CI|GITHUB_WORKSPACE|GITHUB_SHA|GITHUB_REF|GITHUB_HEAD_REF|GITHUB_BASE_REF|RUNNER_TEMP|RUNNER_OS|HOME|DISPLAY|XAUTHORITY|XDG_RUNTIME_DIR|PLAYWRIGHT_BROWSERS_PATH) keep+=("$key");;
    esac
  done < <(compgen -e)
  preserved=$(IFS=,; echo "${keep[*]}")
  exec sudo -n --preserve-env="$preserved" unshare --net -- bash -c "$runner" bash "$parent" "$uid" "$gid" "$outer_path" "$@"
fi
