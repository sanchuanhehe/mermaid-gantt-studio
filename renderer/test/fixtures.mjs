export const fixtures=[
 {name:'weekends-excludes-includes',source:`gantt
 dateFormat YYYY-MM-DD
 excludes weekends
 includes 2026-09-12
 section Delivery
 Work :a, 2026-09-11, 3d
 Follow :b, after a, 2d`,expect:{id:'a',end:'2026-09-15'}},
 {name:'custom-date-format-and-weekend',source:`gantt
 dateFormat DD-MM-YYYY
 axisFormat %d.%m
 excludes weekends
 weekend friday
 section Team
 Work :a, 10-09-2026, 3d`,expect:{id:'a',end:'2026-09-15'}},
 {name:'implicit-start-and-multi-after',source:`gantt
 dateFormat YYYY-MM-DD
 section Team
 A :a, 2026-09-01, 2d
 Implicit :3d
 B :b, 2026-09-02, 7d
 Join :c, after a b, 1d`,expect:{id:'c',start:'2026-09-09'}},
 {name:'until',source:`gantt
 dateFormat YYYY-MM-DD
 section Team
 Target :milestone, target, 2026-09-20, 0d
 Prep :a, 2026-09-01, until target`,expect:{id:'a',end:'2026-09-20'}},
 {name:'inclusive-end-dates',source:`gantt
 dateFormat YYYY-MM-DD
 inclusiveEndDates
 section Team
 Work :a, 2026-09-01, 2026-09-03`,expect:{id:'a',end:'2026-09-04'}},
 {name:'hour-minute-second-millisecond',source:`gantt
 dateFormat YYYY-MM-DD HH:mm:ss.SSS
 axisFormat %H:%M:%S
 tickInterval 1hour
 section Team
 A :a, 2026-09-10 09:00:00.000, 4h
 B :b, after a, 30m
 C :c, after b, 30s
 D :d, after c, 500ms`,expect:{id:'d',end:'2026-09-10T13:30:30.500Z'}},
 {name:'fraction-month-year',source:`gantt
 dateFormat YYYY-MM-DD
 section Team
 Fraction :a, 2026-09-01, 1.5d
 Month :b, 2026-09-01, 1M
 Year :c, after b, 1y`,expect:{id:'c',end:'2027-10-01'}},
 {name:'nonzero-milestone-and-vert',source:`gantt
 dateFormat YYYY-MM-DD
 section Team
 A :a, 2026-09-01, 10d
 Release :milestone, m, 2026-09-05, 2d
 Deadline :vert, v, 2026-09-08, 0d`,expect:{id:'m',start:'2026-09-05',end:'2026-09-07'}},
 {name:'frontmatter-compact',source:`---
config:
  gantt:
    displayMode: compact
---
gantt
 dateFormat YYYY-MM-DD
 section Team
 A :a, 2026-09-01, 2d
 B :b, after a, 2d
 C :c, 2026-09-01, 2d`,compact:true},
 {name:'init-axis-ticks-and-today-off',source:`%%{init: {"gantt":{"topAxis":true},"theme":"neutral"}}%%
gantt
 dateFormat YYYY-MM-DD
 axisFormat %b %d
 tickInterval 1week
 weekday monday
 todayMarker off
 section Team
 A :done, a, 2026-09-01, 30d
 B :active, crit, b, after a, 3d`},
 {name:'multiple-excludes',source:`gantt
 dateFormat YYYY-MM-DD
 excludes weekends
 excludes 2026-09-14
 section Team
 A :a, 2026-09-11, 3d`,expect:{id:'a',end:'2026-09-17'}},
];
