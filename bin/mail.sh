#!/usr/bin/env bash
# Local Mailpit helper.
#   ./bin/mail.sh          the latest 10 messages: to | reply-to | subject
#   ./bin/mail.sh show 1   the newest message's headers, text and HTML (2 = the one before, …)
#   ./bin/mail.sh clear    empty the inbox
set -euo pipefail
api=${MAILPIT_URL:-http://localhost:8025}/api/v1
case ${1:-list} in
  clear) curl -s -X DELETE "$api/messages" >/dev/null && echo "Mailpit cleared." ;;
  show)
    id=$(curl -s "$api/messages?limit=${2:-1}" | python3 -c 'import json, sys; print(json.load(sys.stdin)["messages"][-1]["ID"])')
    curl -s "$api/message/$id" | python3 -c '
import json, sys
m = json.load(sys.stdin)
print("To:", ", ".join(a["Address"] for a in m["To"]))
print("Reply-To:", ", ".join(a["Address"] for a in m.get("ReplyTo") or []))
print("From:", m["From"]["Name"], "<" + m["From"]["Address"] + ">")
print("Subject:", m["Subject"])
print("--- text"); print(m["Text"])
print("--- html"); print(m["HTML"])' ;;
  *)
    curl -s "$api/messages?limit=10" | python3 -c '
import json, sys
for m in json.load(sys.stdin)["messages"]:
    print(", ".join(a["Address"] for a in m["To"]), "|", ", ".join(a["Address"] for a in m.get("ReplyTo") or []), "|", m["Subject"])' ;;
esac
