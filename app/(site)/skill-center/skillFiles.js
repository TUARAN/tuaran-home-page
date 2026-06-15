export function getSkillFileEntries(skill) {
  const files = [
    { filename: 'SKILL.md', content: skill.codex.skillMd },
    { filename: 'agents/openai.yaml', content: skill.codex.openaiYaml },
    ...(skill.codex.extraFiles || []),
  ]
  return files.filter((file) => file.filename && typeof file.content === 'string')
}
