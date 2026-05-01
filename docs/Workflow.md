## # TEAM WORKFLOW  
##   
## ---  
##   
## # Branching Strategy  
##   
## ```text  
## main  
## └── dev  
##     └── feature branches  
## ```  
##   
## - `main` contains stable and production-ready code.  
## - `dev` is the primary integration branch for active development.  
## - Feature branches are created from `dev`.  
##   
## ---  
##   
## # Workflow Lifecycle  
##   
## ```text  
## → All tasks and issues start in Backlog
## → A task is moved to the Todo column if it needs to implementated in the sprint
## → Create Feature Branch from dev  
## → Commit Changes  
## → Open Pull Request into dev  
## → Review  
## → Run CI and Tests  
## → Merge into dev  
## → Delete Feature Branch  
##   
## When dev is stable:  
## → Open Pull Request from dev into main  
## → Final Review and Testing  
## → Merge into main  
## ```  
##   
## This is the core workflow the team will follow throughout development.  
##   
## ---  
##   
## # 1. Every Task Starts as a GitHub Issue  
##   
## Examples:  
##   
## ```text  
## #12 Setup FastAPI backend  
## #13 Create login endpoint  
## #14 Create assessment interface  
## ```  
##   
## Issues help track:  
## - responsibilities  
## - progress  
## - implementation history  
##   
## ---  
##   
## # 2. Create a Feature Branch per Task  
##   
## ## Branch Naming Convention  
##   
## ```text  
## feature/<feature-name>  
## fix/<bug-name>  
## docs/<documentation-name>  
## ```  
##   
## Examples:  
##   
## ```text  
## feature/auth-system   
## fix/login-validation  
## docs/backend-setup  
## ```  
##   
## Feature branches must always be created from the `dev` branch.  
##   
## ---  
##   
## # 3. Commit Regularly  
##   
## ## Good Commit Examples  
##   
## ```text  
## Add backend project structure  
## Create user schemas  
## Implement login endpoint  
## Fix order validation bug  
## ```  
##   
## Commits should:  
## - be meaningful  
## - describe a single logical change  
## - remain small and manageable where possible  
##   
## ---  
##   
## # 4. Open Pull Request into `dev`  
##   
## ## Example PR Titles  
##   
## ```text  
## Add FastAPI backend scaffold  
## Implement user authentication  
## Create drone tracking endpoints  
## ```  
##   
## All implementation work must go through a Pull Request before merging into `dev`.  
##   
## ---  
##   
## # 5. Require at Least One Review  
##   
## Even a quick teammate review helps:  
## - catch mistakes  
## - improve code quality  
## - spread project knowledge across the team  
## - maintain consistent coding standards  
##   
## ---  
##   
## # 6. Test Before Merge  
##   
## Continuous Integration (CI) pipelines and testing must pass before merging.  
##   
## ## Merge Checklist  
## - backend starts correctly  
## - frontend builds successfully  
## - no merge conflicts  
## - linting passes  
## - unit tests pass  
## - CI pipeline passes  
##   
## No Pull Request should be merged if required tests fail.  
##   
## ---  
##   
## # 7. Merge Pull Request into `dev`  
##   
## After successful review and testing:  
##   
## - merge PR into `dev`  
## - delete feature branch  
## - move linked issue to `Done`  
##   
## ---  
##   
## # 8. Merge `dev` into `main`  
##   
## When the `dev` branch reaches a stable release state:  
##   
## - open a Pull Request from `dev` into `main`  
## - perform final review and testing  
## - ensure all CI checks pass  
## - verify that the integrated system functions correctly  
##   
## Only stable and verified code may be merged into `main`.  
##   
## ---  
##   
## # GitHub Project Board  
##   
## ## Workflow Columns  
##   
## ```text  
## Backlog  
## Todo  
## In Progress  
## On Hold  
## Review  
## Done  
## ```  
##   
## The project board is used to:  
## - track task progress  
## - manage workload  
## - organize sprint activity  
## - monitor feature completion  
##   
## ---  
##   
## # Team Rules  
##   
## ## RULE 1  
## Never push broken code to `main`.  
##   
## ---  
##   
## ## RULE 2  
## Never work directly on `main`.  
## Documentation-only changes that do not affect implementation may be committed directly if necessary.  
##   
## Only Pull Requests from `dev` may be merged into `main`.    
## ---  
##   
## ## RULE 3  
## Every feature gets its own branch.  
##   
## ---  
##   
## ## RULE 4  
## Every Pull Request should reference an issue.  
##   
## Example:  
##   
## ```text  
## Closes #14  
## ```  
##   
## GitHub automatically links and closes issues after merge.  
##   
## ---  
##   
## ## RULE 5  
## Delete merged branches.  
##   
## This keeps the repository clean and organized.  
##   
## ---  
##   
## ## RULE 6  
## All CI checks and required tests must pass before merging.  
##   
 
