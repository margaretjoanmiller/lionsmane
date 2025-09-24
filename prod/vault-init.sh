#!/usr/bin/env sh

set -ex

unseal () {
bao operator unseal $(grep 'Key 1:' /openbao/file/keys | awk '{print $NF}')
bao operator unseal $(grep 'Key 2:' /openbao/file/keys | awk '{print $NF}')
bao operator unseal $(grep 'Key 3:' /openbao/file/keys | awk '{print $NF}')
}

init () {
mkdir -p /openbao/file
bao operator init > /openbao/file/keys
}

log_in () {
   export ROOT_TOKEN=$(grep 'Initial Root Token:' /openbao/file/keys | awk '{print $NF}')
   bao login $ROOT_TOKEN
}

create_token () {
   bao token create -id $MY_VAULT_TOKEN
}

if [ -s /openbao/file/keys ]; then
   unseal
else
   init
   unseal
   log_in
   create_token
fi

log_in
bao secrets enable -path=secret kv-v2
bao write lionsmanesecretpolicy /openbao/policies/lion-policy.hcl

bao status > /openbao/file/status
