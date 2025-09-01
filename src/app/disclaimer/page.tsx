export const dynamic = 'force-static'

export default function DisclaimerPage() {
  return (
    <main className="max-w-3xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-semibold">隐私与法律声明</h1>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">一、信息收集与使用</h2>
        <p>为实现投票管理、结果统计与真实性校验之必要目的，系统将收集并处理您在投票时主动提交的姓名、手机号码、手写签名图片等信息，并可能记录必要的技术信息（如时间戳、设备信息与网络标识）。前述信息仅在实现前述目的所必需的范围内使用，不会超出该等范围进行处理。</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">二、投票统计与系统限制</h2>
        <p>系统采用"同一手机号码仅可投票一次"等合理措施进行重复控制；但鉴于电子系统及网络环境的复杂性，仍可能因不可抗力、第三方攻击、设备异常或其他非可控因素导致统计偏差、延迟或中断。您理解并同意该等客观限制，并认可统计结果可能存在合理误差。</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">三、合法合规与用途限定</h2>
        <p>本系统仅可用于合法、正当、合规之目的，不得用于违法违规、侵犯他人合法权益或违反公序良俗的活动。您承诺：投票主题与内容来源合法，目的正当，且已依法获得必要授权（如适用）。</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">四、用户责任</h2>
        <p>您应确保所提交信息真实、准确、完整，并对因您自身操作不当或设备、网络安全管理不善导致的任何后果承担责任，包括但不限于信息泄露、篡改、丢失及由此产生的纠纷。</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">五、免责条款</h2>
        <p>在适用法律允许的最大范围内，组织方与系统提供方对于因不可抗力、法律政策变化、政府监管指令、网络或电力故障、第三方攻击或服务故障、用户操作失误等导致的服务中断、数据偏差或损失不承担任何明示或默示之担保或赔偿责任。</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">六、数据存储与保留</h2>
        <p>在实现投票统计及依法留存之必要期间内，系统将以合理方式存储相关数据；保存期限届满或保存目的已达成时，将依法删除或进行去标识化处理，法律法规另有规定或监管要求的除外。</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">七、联系与申诉</h2>
        <p>如需查询、更正或删除您的个人信息，或就本声明相关事宜进行咨询与申诉，请通过组织方指定渠道与我们联系，我们将依法在合理期限内处理。</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">八、同意与生效</h2>
        <p>当您点击"同意并继续"、提交信息或继续使用本系统，即视为您已充分阅读、理解并同意本《隐私与法律声明》之全部条款。</p>
      </section>
    </main>
  )
}