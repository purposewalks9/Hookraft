"use client"
import { ContributionCalendar } from "@hookraft/use-github-contributions"



export function DemoTheme() {
  

  return (
    <div className="flex flex-col gap-4 p-6">
      <ContributionCalendar
        username="purposewalks9"
        year={2026}
        blockSize={8}
        blockGap={2}
        showThemeSwitcher={true}
        proxyUrl="/api/github-contributions"
      />
    </div>
  )
}