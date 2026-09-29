# Epic: Magika Binary Filter

## Objective
Implement a `SYSTEM_SKILL` that utilizes Google's Magika to intelligently pre-filter binary files during I-Wish ingest phases, significantly reducing token usage and parsing errors.

## Key Results
- Magika CLI wrapper script is implemented and documented as a standard I-Wish skill.
- The skill accurately excludes >99% of unrecognized binary files in test repositories.
- Integration hooks into `/absorb-repo` are clearly defined.

## User Stories
- [x] **story-magika-filter-1**: Create the Magika System Skill wrapper and parsing script.
- [x] **story-magika-filter-2**: Update Repo Absorption Protocol to invoke the Magika filter before Repomix.
