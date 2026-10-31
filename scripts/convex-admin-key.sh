#!/bin/sh
set -eu

key_file=${CONVEX_ADMIN_KEY_FILE:-/credentials/admin-key}
key_owner=${CONVEX_ADMIN_KEY_OWNER:-1001:1001}
generator_directory=${CONVEX_GENERATOR_DIRECTORY:-/convex}
generator=${CONVEX_GENERATOR:-./generate_admin_key.sh}

mkdir -p "$(dirname "$key_file")"

if [ -s "$key_file" ] && [ "${FORCE_REGENERATE_ADMIN_KEY:-0}" != '1' ]; then
  echo 'Reusing the stored Convex admin credential.'
  exit 0
fi

umask 077
temporary_key="${key_file}.tmp.$$"
temporary_error="${key_file}.error.$$"
trap 'rm -f "$temporary_key" "$temporary_error"' EXIT HUP INT TERM

cd "$generator_directory"
if ! "$generator" > "$temporary_key" 2> "$temporary_error"; then
  echo 'Error: Convex could not generate an admin credential.' >&2
  exit 1
fi

if [ ! -s "$temporary_key" ]; then
  echo 'Error: Convex did not generate an admin credential.' >&2
  exit 1
fi

chown "$key_owner" "$temporary_key"
chmod 600 "$temporary_key"
mv "$temporary_key" "$key_file"
rm -f "$temporary_error"
trap - EXIT HUP INT TERM

echo 'Stored the Convex admin credential.'
