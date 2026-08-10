import { Sliders, BookOpenText } from "@phosphor-icons/react";
import { Reveal } from "./motion/Reveal";
import { MockProfilesSettings } from "./mock/MockProfilesSettings";

export function ProfilesSection() {
  return (
    <section id="profiles" className="border-t border-[var(--border)] py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <h2 className="text-3xl font-semibold tracking-tighter md:text-4xl">
              Configure profiles
              <br />
              and global skills
            </h2>
            <p className="mt-4 max-w-[48ch] text-sm leading-relaxed text-[var(--muted-foreground)]">
              Duplicate bundled AgentProfiles, edit the base system prompt, and attach
              skills from your global{" "}
              <code className="font-mono text-[11px] text-[var(--foreground)]">
                npx skills
              </code>{" "}
              directories. Create new SKILL.md files in-app under{" "}
              <code className="font-mono text-[11px] text-[var(--foreground)]">
                ~/.agents/skills
              </code>
              .
            </p>

            <ul className="mt-8 space-y-4">
              <li className="flex gap-3">
                <Sliders
                  size={18}
                  className="mt-0.5 shrink-0 text-[var(--muted-foreground)]"
                  weight="light"
                />
                <div>
                  <p className="text-sm font-medium">Bundled roles, custom copies</p>
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                    Planner, Architect, Frontend, and more ship read-only. Duplicate to
                    customize prompts without touching defaults.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <BookOpenText
                  size={18}
                  className="mt-0.5 shrink-0 text-[var(--muted-foreground)]"
                  weight="light"
                />
                <div>
                  <p className="text-sm font-medium">Skills at Play time</p>
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                    Selected skill ids resolve to SKILL.md on disk and inject into the
                    OrchestraAgent preamble when you hit Play.
                  </p>
                </div>
              </li>
            </ul>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="glass-panel rounded-[2rem] p-4">
              <MockProfilesSettings />
            </div>
            <p className="mt-3 pl-1 font-mono text-[10px] text-[var(--muted-foreground)]">
              Settings → Agent Profiles · case-sensitive model names
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
