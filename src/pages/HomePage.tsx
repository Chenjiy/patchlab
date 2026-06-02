import { useNavigate } from 'react-router-dom'
import { getFabrics, getProjects } from '../services/storageService'

export default function HomePage() {
  const navigate = useNavigate()
  const fabricCount = getFabrics().length
  const projectCount = getProjects().length

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden px-8 py-16 lg:py-24">
        <div className="absolute top-8 right-12 text-primary/20 text-6xl select-none">✿</div>
        <div className="absolute bottom-8 left-8 text-secondary/30 text-4xl select-none">✦</div>
        <div className="absolute top-1/3 right-1/4 text-accent/30 text-2xl select-none">◆</div>

        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6">
            ✿ 用心手作
          </div>
          <h1 className="text-4xl lg:text-5xl font-display font-bold text-text-primary leading-tight mb-4">
            先设计，
            <br />
            <span className="text-primary">再裁布。</span>
          </h1>
          <p className="text-text-secondary text-lg mb-8 leading-relaxed max-w-xl">
            把真实的面料变成数字纹理，在剪布前先试拼出你的拼布创意。
          </p>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => navigate('/upload')}
              className="px-6 py-3 bg-primary text-white rounded-2xl font-medium text-sm hover:bg-primary-dark transition-colors shadow-soft hover:shadow-card"
            >
              上传面料
            </button>
            <button
              onClick={() => navigate('/studio')}
              className="px-6 py-3 bg-card text-text-primary rounded-2xl font-medium text-sm border border-border hover:border-primary/30 hover:shadow-card transition-all"
            >
              开始设计
            </button>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="px-8 mb-10">
        <div className="flex gap-6">
          <div className="bg-card rounded-2xl border border-border px-5 py-4 shadow-soft flex items-center gap-3">
            <span className="text-2xl">🧵</span>
            <div>
              <p className="text-2xl font-bold text-text-primary">{fabricCount}</p>
              <p className="text-xs text-text-secondary">已保存面料</p>
            </div>
          </div>
          <div className="bg-card rounded-2xl border border-border px-5 py-4 shadow-soft flex items-center gap-3">
            <span className="text-2xl">🗂️</span>
            <div>
              <p className="text-2xl font-bold text-text-primary">{projectCount}</p>
              <p className="text-xs text-text-secondary">已创建设计</p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section className="px-8 pb-16">
        <h2 className="text-lg font-semibold text-text-primary mb-5">使用方法</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              icon: '📷',
              title: '保存你的面料',
              desc: '上传真实面料的照片，将其裁剪保存为数字纹理，建立你的专属面料库。',
              color: 'bg-primary/8',
              action: () => navigate('/upload'),
              cta: '立即上传 →',
            },
            {
              icon: '✂️',
              title: '创建布块贴片',
              desc: '选择一个蒙版形状——爱心、圆形、星星、口袋——用面料库中的纹理填充它。',
              color: 'bg-secondary/20',
              action: () => navigate('/studio'),
              cta: '打开工坊 →',
            },
            {
              icon: '👁️',
              title: '预览手作设计',
              desc: '把布块拖放到画布上，调整大小和旋转，在裁布前就看到成品效果。',
              color: 'bg-accent/20',
              action: () => navigate('/gallery'),
              cta: '查看作品 →',
            },
          ].map((card) => (
            <div
              key={card.title}
              className="bg-card rounded-3xl border border-border p-6 shadow-soft hover:shadow-card-hover hover:-translate-y-1 transition-all duration-200 cursor-pointer group"
              onClick={card.action}
            >
              <div className={`w-12 h-12 ${card.color} rounded-2xl flex items-center justify-center text-2xl mb-4`}>
                {card.icon}
              </div>
              <h3 className="font-semibold text-text-primary mb-2">{card.title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed mb-4">{card.desc}</p>
              <span className="text-xs font-medium text-primary group-hover:underline">{card.cta}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="px-8 pb-8">
        <div className="h-px border-t-2 border-dashed border-primary/20" />
      </div>
    </div>
  )
}
