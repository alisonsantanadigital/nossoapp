#!/bin/bash
find src -type f \( -name "*.tsx" -o -name "*.ts" -o -name "*.css" \) -exec sed -i \
  -e 's/bg-\[#0B1121\]/bg-slate-50/g' \
  -e 's/bg-\[#0F172A\]/bg-slate-50/g' \
  -e 's/bg-\[#131B2F\]/bg-white/g' \
  -e 's/bg-\[#1E293B\]/bg-slate-100/g' \
  -e 's/border-\[#1E293B\]/border-slate-200/g' \
  -e 's/border-slate-800/border-slate-200/g' \
  -e 's/border-slate-700/border-slate-300/g' \
  -e 's/text-slate-100/text-slate-800/g' \
  -e 's/text-slate-300/text-slate-600/g' \
  -e 's/text-slate-400/text-slate-500/g' \
  -e 's/text-white/text-slate-900/g' \
  -e 's/bg-sky-500 text-slate-900/bg-sky-500 text-white/g' \
  {} +
