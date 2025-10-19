'use client'

interface BlogGaugeProps {
  currentGrade: string
  className?: string
}

const grades = [
  { name: '일반', color: '#6B7280', angle: 0 },
  { name: '준최1', color: '#10B981', angle: 12.85 },
  { name: '준최2', color: '#10B981', angle: 25.7 },
  { name: '준최3', color: '#10B981', angle: 38.55 },
  { name: '준최4', color: '#3B82F6', angle: 51.4 },
  { name: '준최5', color: '#3B82F6', angle: 64.25 },
  { name: '준최6', color: '#3B82F6', angle: 77.1 },
  { name: '준최7', color: '#8B5CF6', angle: 90 },
  { name: '최적1', color: '#8B5CF6', angle: 102.85 },
  { name: '최적2', color: '#F97316', angle: 115.7 },
  { name: '최적3', color: '#F97316', angle: 128.55 },
  { name: '최적1+', color: '#F97316', angle: 141.4 },
  { name: '최적2+', color: '#EF4444', angle: 154.25 },
  { name: '최적3+', color: '#EF4444', angle: 167.1 },
  { name: '최적4+', color: '#EF4444', angle: 180 },
]

export default function BlogGauge({ currentGrade, className = '' }: BlogGaugeProps) {
  const currentGradeData = grades.find(g => g.name === currentGrade) || grades[2] // 기본값: 준최2

  const angleToCoords = (angle: number, radius: number, centerX: number, centerY: number) => {
    // 0도를 왼쪽(9시 방향)으로, 180도를 오른쪽(3시 방향)으로 설정
    const radian = (angle + 180) * (Math.PI / 180)
    const x = centerX + radius * Math.cos(radian)
    const y = centerY + radius * Math.sin(radian)
    return { x, y }
  }

  const centerX = 250
  const centerY = 180
  const radius = 140
  const labelRadius = 150

  return (
    <div className={`relative ${className}`}>
      <svg width="500" height="250" viewBox="0 0 500 250" className="h-full w-full">
        {/* 배경 반원 */}
        <path
          d={`M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}`}
          fill="none"
          stroke="#374151"
          strokeWidth="2"
        />

        {/* 등급 표시 */}
        {grades.map((grade, index) => {
          const coords = angleToCoords(grade.angle, radius - 10, centerX, centerY)
          const labelCoords = angleToCoords(grade.angle, labelRadius, centerX, centerY)

          return (
            <g key={grade.name}>
              <line
                x1={coords.x}
                y1={coords.y}
                x2={labelCoords.x}
                y2={labelCoords.y}
                stroke={grade.color}
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* 등급 텍스트 */}
              <text
                x={labelCoords.x}
                y={labelCoords.y - 8}
                fill={grade.color}
                fontSize="12"
                fontWeight="500"
                textAnchor="middle"
                className="select-none">
                {grade.name}
              </text>
            </g>
          )
        })}

        {/* 현재 등급 포인터 */}
        <g>
          {/* 포인터 라인 */}
          <line
            x1={centerX}
            y1={centerY}
            x2={angleToCoords(currentGradeData.angle, radius - 20, centerX, centerY).x}
            y2={angleToCoords(currentGradeData.angle, radius - 20, centerX, centerY).y}
            stroke="#3B82F6"
            strokeWidth="4"
            strokeLinecap="round"
          />

          {/* 중심점 */}
          <circle cx={centerX} cy={centerY} r="6" fill="#374151" stroke="#3B82F6" strokeWidth="2" />
        </g>
      </svg>

      <div className="absolute inset-0 bottom-[40px] flex flex-col items-center justify-center pt-8">
        <div className="mb-1 text-sm text-white">블로그지수</div>
        <div className="text-3xl font-bold text-green-400">{currentGrade}</div>
      </div>
    </div>
  )
}
