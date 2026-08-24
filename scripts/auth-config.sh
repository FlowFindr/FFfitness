#!/usr/bin/env bash
# Read and change FlowFindr-Fitness auth settings through the Supabase
# Management API. Kept as a script because "nothing is manual for the admin"
# applies to the admin too: the SMTP body has eight fields and getting one
# wrong fails silently, with mail simply never arriving.
#
# Secrets come from the environment and are never written to disk:
#
#   export SUPABASE_ACCESS_TOKEN=...   # supabase.com/dashboard/account/tokens
#   export RESEND_API_KEY=...          # only needed by `smtp`
#
# Usage:
#   scripts/auth-config.sh show
#   scripts/auth-config.sh smtp
#   scripts/auth-config.sh autoconfirm on|off
#   scripts/auth-config.sh test-email you@example.com

set -euo pipefail

PROJECT_REF="${PROJECT_REF:-qnnqnyptmhznlfiszvtn}"
API="https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth"
SENDER_NAME="FlowFindr Fitness"
SENDER_ADDR="${SENDER_ADDR:-no-reply@flowfindr.com.au}"

die() { printf 'error: %s\n' "$1" >&2; exit 1; }

need_token() {
  [ -n "${SUPABASE_ACCESS_TOKEN:-}" ] || die "SUPABASE_ACCESS_TOKEN is not set. Get one from https://supabase.com/dashboard/account/tokens"
}

# Pull out the fields that decide whether mail actually leaves the building.
summarise() {
  python3 -c '
import json, sys
d = json.load(sys.stdin)
if "message" in d and "smtp_host" not in d:
    print("  API said:", d["message"]); sys.exit(1)
host = d.get("smtp_host") or None
rows = [
    ("custom SMTP",        "configured" if host else "NOT configured — mail only reaches project team members"),
    ("smtp_host",          host or "-"),
    ("smtp_port",          d.get("smtp_port") or "-"),
    ("smtp_user",          d.get("smtp_user") or "-"),
    ("sender",             d.get("smtp_admin_email") or "-"),
    ("sender name",        d.get("smtp_sender_name") or "-"),
    ("email sign-up",      "on" if d.get("external_email_enabled") else "off"),
    ("confirmation email", "SKIPPED (autoconfirm on)" if d.get("mailer_autoconfirm") else "required"),
    ("emails per hour",    d.get("rate_limit_email_sent") or "-"),
    ("site url",           d.get("site_url") or "-"),
    ("redirect allow-list", d.get("uri_allow_list") or "- (password reset redirects will be rejected)"),
]
w = max(len(k) for k, _ in rows)
for k, v in rows:
    print(f"  {k.ljust(w)}  {v}")
'
}

cmd="${1:-show}"

case "$cmd" in
  show)
    need_token
    echo "auth config for $PROJECT_REF:"
    curl -fsS "$API" -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" | summarise
    ;;

  smtp)
    need_token
    [ -n "${RESEND_API_KEY:-}" ] || die "RESEND_API_KEY is not set. Create an SMTP credential at resend.com after verifying the sending domain."
    echo "pointing auth email at smtp.resend.com as $SENDER_ADDR ..."
    curl -fsS -X PATCH "$API" \
      -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
      -H "Content-Type: application/json" \
      -d "$(python3 -c '
import json, os
print(json.dumps({
  "external_email_enabled": True,
  "mailer_autoconfirm": False,
  "mailer_secure_email_change_enabled": True,
  "smtp_admin_email": os.environ["SENDER_ADDR"],
  "smtp_host": "smtp.resend.com",
  "smtp_port": 587,
  "smtp_user": "resend",
  "smtp_pass": os.environ["RESEND_API_KEY"],
  "smtp_sender_name": os.environ["SENDER_NAME"],
}))' )" > /dev/null
    echo "applied. reading it back:"
    curl -fsS "$API" -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" | summarise
    echo
    echo "now prove it: scripts/auth-config.sh test-email <your address>"
    ;;

  autoconfirm)
    need_token
    case "${2:-}" in
      on)  val=true ;;
      off) val=false ;;
      *)   die "usage: $0 autoconfirm on|off" ;;
    esac
    if [ "$val" = true ]; then
      echo "WARNING: addresses will no longer be verified. Reasonable for a beta of"
      echo "people you know; not acceptable at public launch. Password reset still"
      echo "needs working email either way."
    fi
    curl -fsS -X PATCH "$API" \
      -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"mailer_autoconfirm\": $val}" > /dev/null
    curl -fsS "$API" -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" | summarise
    ;;

  test-email)
    addr="${2:-}"
    [ -n "$addr" ] || die "usage: $0 test-email you@example.com"
    key=$(grep '^VITE_SUPABASE_PUBLISHABLE_KEY=' .env.local 2>/dev/null | cut -d= -f2- || true)
    [ -n "$key" ] || die "no VITE_SUPABASE_PUBLISHABLE_KEY in .env.local"
    url=$(grep '^VITE_SUPABASE_URL=' .env.local | cut -d= -f2-)
    echo "asking for a password reset to $addr ..."
    code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$url/auth/v1/recover" \
      -H "apikey: $key" -H "Content-Type: application/json" \
      -d "{\"email\":\"$addr\"}")
    echo "  HTTP $code"
    echo
    echo "A 200 only means Supabase accepted the request. It says nothing about"
    echo "delivery: with no custom SMTP, mail to a non-team address is dropped"
    echo "silently. Check the inbox, and if it is empty check the project's Auth"
    echo "logs for the send attempt."
    ;;

  *) die "unknown command: $cmd (try show, smtp, autoconfirm, test-email)" ;;
esac
