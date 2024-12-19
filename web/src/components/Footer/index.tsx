import './index.css'
export default function Footer() {
  return (
    <div className="policy-wrap">
      <a href="javscript:;" className="link ">
        用户协议
      </a>
      &nbsp;
      <span>&nbsp;|&nbsp;</span>&nbsp;
      <a href="javscript:;" className="link">
        隐私政策
      </a>
      &nbsp;
      <span>{window.__SITE_CONFIG__?.copyright || '© 2020 深圳市云展信息技术有限公司 | GotoAI 版权所有 粤ICP备15077337号 '}</span>
    </div>
  )
}
