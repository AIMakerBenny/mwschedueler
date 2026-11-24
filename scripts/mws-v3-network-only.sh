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
  exec sudo -n --preserve-env=MWS_QA_OFFLINE,MWS_QA_SESSION,MWS_QA_IDLE_MODE,MWS_QA_LONG_IDLE,MWS_QA_IDLE_VISIBILITY,MWS_QA_FEATURES_ONLY unshare --net -- bash -c "$runner" bash "$parent" "$uid" "$gid" "$outer_path" "$@"
fi
