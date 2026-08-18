import re

with open("src/components/LeadDetailModal.tsx", "r") as f:
    content = f.read()

# We will perform precise regex replacements to swap dark mode classes for light mode classes.
# But since the DOM structure needs to change, it's better to replace the sections entirely.

