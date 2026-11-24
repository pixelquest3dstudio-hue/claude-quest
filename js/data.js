// All videos come from the "Master The Claude Ecosystem" playlist by Futurepedia.
export const VIDEOS = {
  ecosystem: { id: 'MS7E5TXNviM', length: 767, title: 'Understand the FULL Claude Ecosystem in One Video' },
  models: { id: '5aUgDDWd4-k', length: 975, start: 82, end: 253, title: 'Use Claude Better Than 99% of People: Plans, Models & Effort (1:22 to 4:13)' },
  tutorial19: { id: 'WSPChlfxJyA', length: 1152, title: 'Full Claude Tutorial: Beginner to Advanced in 19 Minutes' },
  connectors: { id: '5aUgDDWd4-k', length: 975, start: 360, end: 451, title: 'Use Claude Better Than 99% of People: Connect Your Tools (6:00 to 7:31)' },
  features3: { id: 'tkpdPvx65A0', length: 759, title: 'The 3 Most Powerful Claude Features Beginners Don’t Know About' },
  skills: { id: 'H0vIPXtrlHw', length: 454, title: 'Claude Skills Made Simple' },
  cowork: { id: '7e3JovO8ngI', length: 891, title: 'Full Claude Cowork Tutorial: The AI That Replaces Your Assistant' },
  code19: { id: '5tgHMa2Z3jc', length: 1149, title: 'From Zero to Claude Code in 19 Minutes (no code)' },
  codeFull: { id: 'bqJzIWAEn40', length: 2452, title: 'Full Claude Code Tutorial for Non-Technical Beginners' },
  design: { id: '3RWm4inkS2E', length: 989, title: 'A Complete Guide to the New Claude Design' },
  motion: { id: '97Y5cz7H8SM', length: 974, title: 'Claude Design Just Unlocked AI Motion Graphics' },
};
for (const [k, v] of Object.entries(VIDEOS)) v.key = k;

export const WORLDS = [
  { key: 'w0', num: '0', name: 'Memory Portal', color: 0xb79cf0, videos: ['ecosystem'], built: true },
  { key: 'w1', num: '1', name: 'Model Meadow', color: 0x8fd694, videos: ['models'], built: true },
  { key: 'w2', num: '2', name: 'Context Caves', color: 0x6fb7e9, videos: ['tutorial19'], built: true },
  { key: 'w3', num: '3', name: 'Connector Cliffs', color: 0xffb86b, videos: ['connectors'], built: true },
  { key: 'w4', num: '4', name: 'Project Village', color: 0xff8fb1, videos: ['features3'], built: true },
  { key: 'w5', num: '5', name: 'Skill Kitchen', color: 0xffd166, videos: ['skills'], built: true },
  { key: 'w6', num: '6', name: 'Cowork Clocktower', color: 0x9ad0c2, videos: ['cowork'], built: true },
  { key: 'w7', num: '7', name: 'Code Cloud Castle', color: 0xa0a8ff, videos: ['code19'], bossVideo: 'codeFull', built: true },
  { key: 'design', num: '★', name: 'Design Studio', color: 0xff9ecf, videos: ['design', 'motion'], bonus: true, built: true },
];

// Sticker-book cheat-sheet cards
export const CARDS = {
  products: {
    title: 'The Four Products', emoji: '🧭', world: 'Memory Portal',
    lines: ['<b>Chat</b> helps you THINK: questions, writing, research, ideas.', '<b>Cowork</b> lets you DELEGATE: hand off a task, come back to finished work.', '<b>Code</b> lets you BUILD: apps, sites, games, in plain English.', '<b>Design</b> lets you CREATE: prototypes, decks, one-pagers, animations.'],
  },
  layers: {
    title: 'The Ecosystem Layers', emoji: '🧱', world: 'Memory Portal',
    lines: ['<b>Skills</b> repeat a task the same way every time.', '<b>Connectors</b> link Claude to your tools (mail, calendar, drive…).', '<b>Plugins</b> bundle skills + connectors for a role or tool.', '<b>Projects, memory & CLAUDE.md</b> keep your context.', '<b>Scheduled tasks</b> run work without you prompting.'],
  },
  memory: {
    title: 'Memory Transfer', emoji: '🧠', world: 'Memory Portal',
    lines: ['Settings → Capabilities → Import memory → <b>Start import</b>.', 'Copy Claude’s prompt and paste it into your old AI.', 'Paste its answer back into Claude and hit <b>Add to memory</b>.', 'Turn ON <b>Search & reference chats</b> and <b>Generate memory from chat history</b>.'],
  },
  models: {
    title: 'Model Critters', emoji: '🐣', world: 'Model Meadow',
    lines: ['<b>Haiku</b>: fastest, lighter answers.', '<b>Sonnet</b>: quick + smart, a great daily driver.', '<b>Opus</b>: bigger, multi-step work; checks its work.', '<b>Fable</b>: very token-heavy; try it when Opus is stuck.', 'Paid plans add more usage, reasoning models, Cowork & Code.'],
  },
  effort: {
    title: 'The Effort Dial', emoji: '🎛️', world: 'Model Meadow',
    lines: ['Effort = how much thinking time (tokens) Claude spends.', '<b>Medium</b>: great for most daily tasks.', '<b>High</b>: coding and analysis.', '<b>Extra high</b>: long agentic or multi-step coding work.', 'More effort isn’t always better: it’s slower and can overcomplicate.'],
  },
  prompting: {
    title: 'Better Prompts', emoji: '💎', world: 'Context Caves',
    lines: ['<b>ICC</b>: Instructions (the task) + Context (role, goals, background) + Constraints (format, length, style, an example).', 'Err on the side of MORE context. A messy context dump is fine.', '<b>Context interview</b>: end with “Ask me any questions you need.”', 'First answers aren’t perfect. <b>Push back and iterate</b> like a collaborator.'],
  },
  research: {
    title: 'Search, Files & Research', emoji: '🔦', world: 'Context Caves',
    lines: ['<b>Web search</b> gives up-to-date info and reduces hallucinations. Ask for it if Claude doesn’t search.', '<b>Ground first, ask second</b>: have Claude research a topic, then ask.', '<b>Files</b>: drop in PDFs, images, spreadsheets. Claude understands images but can’t generate them.', '<b>Artifacts</b> open in a side panel. <b>Research</b> mode plans, searches widely and cites sources.'],
  },
  connectors: {
    title: 'Connectors', emoji: '🔌', world: 'Connector Cliffs',
    lines: ['<b>Customize → Connectors → Add → Browse</b>, click <b>+</b>, then sign in.', 'Mail: how you reply and who your clients are. Calendar: what’s going on.', 'Meeting notes: analyze them, draft follow-ups. Drive: your files.', 'You choose each connector’s <b>permissions</b>. Some are read-only, some take actions.'],
  },
  customConnector: {
    title: 'Custom Connectors', emoji: '🎨', world: 'Connector Cliffs',
    lines: ['Claude has no image generator of its own, but a connector can bring one in.', '<b>Add → Add custom connector</b>.', 'Give it a <b>name</b> and paste the tool’s connector <b>URL</b>.', '<b>Log in</b> when it asks. Done!'],
  },
  projects: {
    title: 'Projects', emoji: '🏡', world: 'Project Village',
    lines: ['A project = <b>instructions</b> + <b>knowledge files</b> + <b>memory</b> (+ its own chats).', 'Projects are <b>walled off</b>: each one only knows what happens inside it.', 'Leave account-level custom instructions blank. Put them in projects.', 'Memory refreshes about once a day. <b>Review it</b> now and then.'],
  },
  artifacts: {
    title: 'Artifacts', emoji: '🛠️', world: 'Project Village',
    lines: ['Standalone things Claude builds in a side panel: docs, dashboards, pages, decks, games.', 'Change them in plain words (“use our brand colors”).', 'You can upload a screenshot to recreate a design.', '<b>Publish</b> to share a link. Others can view, use, and <b>customize</b> it.'],
  },
  skills: {
    title: 'Skills', emoji: '📇', world: 'Skill Kitchen',
    lines: ['A skill = a <b>recipe card</b> for a workflow. Write it once and it triggers automatically, the same way every time.', 'Works across Chat, Cowork and Code. Under the hood it’s just a markdown file.', 'Turn on <b>Settings → Capabilities → Code execution and file creation</b>.', 'Built-ins: PowerPoint, spreadsheets, Word, PDF. Browse more under <b>Customize → Skills</b>.', '<b>Plugins</b> bundle skills + connectors (a whole cookbook).'],
  },
  skillSafety: {
    title: 'Build & Share Skills', emoji: '🔥', world: 'Skill Kitchen',
    lines: ['Do the task with Claude and iterate, then say <b>“Package everything we just did into a skill.”</b>', '<b>Test it, critique it, and ask Claude to update the skill.</b> Keep refining!', 'Old chats where you went back and forth can become skills right now.', 'Upload skills via Customize → Skills → Add → Upload. <b>Only from people you trust, and always look inside.</b>'],
  },
  cowork: {
    title: 'Cowork', emoji: '⏰', world: 'Cowork Clocktower',
    lines: ['An AI agent on your computer: <b>describe the outcome, step away, come back to finished work.</b>', 'Desktop app, paid plan (Pro or Max). Tabs: Chat · Cowork · Code.', 'Give it a <b>new or duplicated folder</b>. Sonnet with thinking for most jobs, Opus for very complex ones.', 'It asks permission and questions, runs sub-agents in parallel, and shows a checklist.', '<b>Scheduled tasks</b> need the desktop app open (otherwise they run next time you open it).'],
  },
  coworkTools: {
    title: 'Cowork Toolbelt', emoji: '🧰', world: 'Cowork Clocktower',
    lines: ['<b>Skills</b>: recipe cards (or trigger one with a slash command).', '<b>Plugins</b>: skills + connectors + commands for a whole job.', '<b>Connectors</b>: Gmail, Drive, Calendar, Slack, Notion… <b>Claude in Chrome</b>: the web.', 'Use the <b>Chat</b> tab to expand a prompt, then paste it into Cowork.', 'No memory across sessions yet: have it keep a <b>running log file</b> in the folder.'],
  },
  claudeCode: {
    title: 'Claude Code Basics', emoji: '🏰', world: 'Code Cloud Castle',
    lines: ['No coding needed. Desktop app → <b>Code</b> tab, one folder per project.', 'Start in <b>plan mode</b>. Answer its questions, adjust the plan, then accept.', 'It tests and fixes its own work. You iterate in plain words, <b>one change at a time</b>, with screenshots.', '<b>/init</b> creates CLAUDE.md, the project’s memory. When a chat is long: summary + fresh chat.', 'Plan and build with Opus, iterate with Sonnet. Usage resets every 5 hours.'],
  },
  deploy: {
    title: 'Go Live Safely', emoji: '🚀', world: 'Code Cloud Castle',
    lines: ['MCPs connect tools (try <b>Context7</b>), skills are processes, plugins bundle them.', 'Run a <b>security review</b>, and ask “anything else before going live?”', '<b>Never paste API keys in chat.</b> Put them in <b>.env.local</b> (git ignores it), then add them in Vercel.', 'Git → <b>GitHub</b> (version control, an undo button) → <b>Vercel</b> (auto-redeploys on every push).'],
  },
  claudeDesign: {
    title: 'Claude Design', emoji: '🎨', world: 'Design Studio',
    lines: ['Open <b>Design</b> in the Claude sidebar or go to <b>claude.ai/design</b>. Any paid plan; usage is bundled in.', 'Start from a <b>template</b>: slides, mobile app, document, UI mockup, animation, 3D object and more.', 'Make a <b>design system</b> first (your brand’s style + voice) so it doesn’t look like everyone else’s.', 'Ask for 2–3 options → <b>tweaks</b> panel. Fix small things with <b>inline edits</b> or annotations.', '<b>Share</b>: send to Claude Code (prompt or zip), or export decks as PowerPoint, PDF or to Canva.'],
  },
  motionGraphics: {
    title: 'Motion Graphics', emoji: '🎬', world: 'Design Studio',
    lines: ['Animations are real code: <b>HTML</b> = structure, <b>CSS</b> = styling, <b>JavaScript</b> = motion.', 'So edits are precise: ask in plain words, naming the section by its title.', 'Paste a timestamped <b>SRT</b> transcript to sync the graphics to your words.', 'Prompt tips: use text minimally, leave the right third open for a talking head.', 'A design system keeps the style across every animation. <b>Share → Video → 1080p MP4</b>.'],
  },
};
