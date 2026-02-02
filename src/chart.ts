import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

export class GrowthChart {
  private chart: Chart | null = null
  private ctx: CanvasRenderingContext2D

  constructor(canvasId: string) {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement
    this.ctx = canvas.getContext('2d')!
  }

  update(history: Array<{ date: string; value: number }>, investedAmount: number): void {
    if (this.chart) {
      this.chart.destroy()
    }

    const labels = history.map(h => {
      const date = new Date(h.date)
      return date.toLocaleDateString('da-DK', { month: 'short', year: '2-digit' })
    })

    const sampledData = this.sampleData(history, 50)
    const sampledLabels = this.sampleData(labels, 50)

    // Create gradient for the line fill
    const gradient = this.ctx.createLinearGradient(0, 0, 0, 200)
    gradient.addColorStop(0, 'rgba(16, 185, 129, 0.3)')
    gradient.addColorStop(1, 'rgba(5, 150, 105, 0)')

    this.chart = new Chart(this.ctx, {
      type: 'line',
      data: {
        labels: sampledLabels,
        datasets: [
          {
            label: 'Portfolio Value',
            data: sampledData.map(h => h.value),
            borderColor: '#10B981',
            backgroundColor: gradient,
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: '#10B981',
            pointHoverBorderColor: '#fff',
            pointHoverBorderWidth: 2,
            borderWidth: 2,
          },
          {
            label: 'Invested',
            data: sampledData.map(() => investedAmount),
            borderColor: 'rgba(255, 255, 255, 0.2)',
            borderDash: [5, 5],
            fill: false,
            pointRadius: 0,
            pointHoverRadius: 0,
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index',
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: 'rgba(15, 17, 23, 0.95)',
            titleColor: '#34D399',
            bodyColor: '#E5E7EB',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 8,
            displayColors: false,
            callbacks: {
              label: (context) => {
                const value = context.parsed.y ?? 0
                return `${value.toLocaleString('da-DK', { maximumFractionDigits: 0 })} kr.`
              },
            },
          },
        },
        scales: {
          x: {
            display: true,
            grid: {
              display: false,
            },
            border: {
              display: false,
            },
            ticks: {
              maxTicksLimit: 6,
              color: '#6B7280',
              font: {
                size: 11,
              },
            },
          },
          y: {
            display: true,
            grid: {
              color: 'rgba(255, 255, 255, 0.05)',
            },
            border: {
              display: false,
            },
            ticks: {
              color: '#6B7280',
              font: {
                size: 11,
              },
              callback: (value) => `${(value as number).toLocaleString('da-DK', { notation: 'compact' })} kr.`,
            },
          },
        },
      },
    })
  }

  updateWithComparison(
    stockHistory: Array<{ date: string; value: number }>,
    marketHistory: Array<{ date: string; value: number }>,
    investedAmount: number,
    stockName: string
  ): void {
    if (this.chart) {
      this.chart.destroy()
    }

    const sampledStock = this.sampleData(stockHistory, 50)
    const sampledMarket = this.sampleData(marketHistory, 50)

    const labels = sampledStock.map(h => {
      const date = new Date(h.date)
      return date.toLocaleDateString('da-DK', { month: 'short', year: '2-digit' })
    })

    // Stock gradient (emerald)
    const stockGradient = this.ctx.createLinearGradient(0, 0, 0, 200)
    stockGradient.addColorStop(0, 'rgba(16, 185, 129, 0.3)')
    stockGradient.addColorStop(1, 'rgba(5, 150, 105, 0)')

    this.chart = new Chart(this.ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: stockName,
            data: sampledStock.map(h => h.value),
            borderColor: '#10B981',
            backgroundColor: stockGradient,
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: '#10B981',
            pointHoverBorderColor: '#fff',
            pointHoverBorderWidth: 2,
            borderWidth: 2,
          },
          {
            label: 'Markedet',
            data: sampledMarket.map(h => h.value),
            borderColor: '#059669',
            backgroundColor: 'transparent',
            fill: false,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: '#059669',
            pointHoverBorderColor: '#fff',
            pointHoverBorderWidth: 2,
            borderWidth: 2,
            borderDash: [5, 5],
          },
          {
            label: 'Investeret',
            data: sampledStock.map(() => investedAmount),
            borderColor: 'rgba(255, 255, 255, 0.15)',
            borderDash: [3, 3],
            fill: false,
            pointRadius: 0,
            pointHoverRadius: 0,
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index',
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            align: 'end',
            labels: {
              color: '#9CA3AF',
              usePointStyle: true,
              pointStyle: 'line',
              padding: 16,
              font: { size: 11 },
              filter: (item) => item.text !== 'Investeret',
            },
          },
          tooltip: {
            backgroundColor: 'rgba(15, 17, 23, 0.95)',
            titleColor: '#34D399',
            bodyColor: '#E5E7EB',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 8,
            displayColors: true,
            callbacks: {
              label: (context) => {
                const value = context.parsed.y ?? 0
                if (context.dataset.label === 'Investeret') return ''
                return `${context.dataset.label}: ${value.toLocaleString('da-DK', { maximumFractionDigits: 0 })} kr.`
              },
            },
          },
        },
        scales: {
          x: {
            display: true,
            grid: { display: false },
            border: { display: false },
            ticks: {
              maxTicksLimit: 6,
              color: '#6B7280',
              font: { size: 11 },
            },
          },
          y: {
            display: true,
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            border: { display: false },
            ticks: {
              color: '#6B7280',
              font: { size: 11 },
              callback: (value) => `${(value as number).toLocaleString('da-DK', { notation: 'compact' })} kr.`,
            },
          },
        },
      },
    })
  }

  private sampleData<T>(data: T[], maxPoints: number): T[] {
    if (data.length <= maxPoints) return data

    const step = Math.ceil(data.length / maxPoints)
    const sampled: T[] = []

    for (let i = 0; i < data.length; i += step) {
      sampled.push(data[i])
    }

    if (sampled[sampled.length - 1] !== data[data.length - 1]) {
      sampled.push(data[data.length - 1])
    }

    return sampled
  }
}
