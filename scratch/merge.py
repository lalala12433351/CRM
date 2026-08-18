import sys

with open("src/components/LeadDetailModal.tsx", "r") as f:
    content = f.read()

# Find the start of the return statement
idx = content.find("  return (\n")
if idx == -1:
    print("Could not find '  return (\\n'")
    sys.exit(1)

pre_return = content[:idx]

with open("scratch/part1.tsx", "r") as f:
    part1 = f.read()

with open("scratch/part2.tsx", "r") as f:
    part2 = f.read()
    
with open("scratch/part3.tsx", "r") as f:
    part3 = f.read()

final_content = pre_return + part1 + "\n" + part2 + "\n" + part3

with open("src/components/LeadDetailModal.tsx", "w") as f:
    f.write(final_content)

print("Successfully merged and overwrote LeadDetailModal.tsx")
