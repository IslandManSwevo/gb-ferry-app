---
description: fix Windows npm global path missing from environment variables
---

1. Check the npm global prefix to find where global packages are installed.
   // turbo
2. run_command: `npm config get prefix`

3. Verify if that prefix is currently in the User Path.
   // turbo
4. run_command: `[Environment]::GetEnvironmentVariable("Path", "User")`

5. If the path is missing, add it permanently to the User Path.
   // turbo
6. run_command: `$prefix = (npm config get prefix); $currentPath = [Environment]::GetEnvironmentVariable("Path", "User"); if ($currentPath -notlike "*$prefix*") { [Environment]::SetEnvironmentVariable("Path", $currentPath + ";$prefix", "User"); echo "Path updated successfully!" }`

7. For the current terminal session, update the active environment.
   // turbo
8. run_command: `$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")`
