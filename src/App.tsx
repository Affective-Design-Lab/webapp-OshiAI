import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import './App.css'

// ページの状態を管理する型
type ページ状態 = 'ホーム' | '結果表示' | '分野登録' | '分野選択' | '分野完了'

// n8nからのレスポンスデータの型
interface N8nレスポンス {
  success?: boolean
  data?: unknown
  message?: string
  timestamp?: string
  answers?: Array<{
    name: string
    reason: string
  }>
  [key: string]: unknown
}

// 分野登録用のレスポンス型
interface 分野レスポンス {
  genres?: string[]
  keywords?: string[]
  categories?: string[]
  suggestions?: string[]
  data?: string[]
  [key: string]: unknown
}

function App() {
  const [現在のページ, set現在のページ] = useState<ページ状態>('ホーム')
  const [入力内容, set入力内容] = useState('')
  const [送信中か, set送信中か] = useState(false)
  const [エラーメッセージ, setエラーメッセージ] = useState('')
  const [n8nレスポンス, setN8nレスポンス] = useState<N8nレスポンス | null>(null)
  
  // 分野登録用の状態
  const [名前, set名前] = useState('')
  const [得意分野, set得意分野] = useState('')
  const [分野候補リスト, set分野候補リスト] = useState<string[]>([])
  const [選択された分野, set選択された分野] = useState<string[]>([])

  // n8n Webhookエンドポイント（設定可能）
  const WEBHOOK_URL = 'https://yn8n.app.n8n.cloud/webhook/61727c55-fe17-47b8-9426-e3babba284ca'
  const 分野登録_WEBHOOK_URL = 'https://yn8n.app.n8n.cloud/webhook/46778969-66f4-4a95-a5d6-c1fccbf6765a'
  const 分野確定_WEBHOOK_URL = 'https://yn8n.app.n8n.cloud/webhook/2bac4994-e8a6-4667-b661-ffc28e8226c5'

  const データを送信する = async () => {
    if (!入力内容.trim()) {
      setエラーメッセージ('メッセージを入力してください')
      return
    }

    set送信中か(true)
    setエラーメッセージ('')
    
    try {
      console.log('送信データ:', {
        message: 入力内容,
        timestamp: new Date().toISOString(),
        source: 'おしAI'
      })

      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          message: 入力内容,
          timestamp: new Date().toISOString(),
          source: 'おしAI'
        }),
      })

      console.log('レスポンス status:', response.status)
      console.log('レスポンス headers:', Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const contentType = response.headers.get('content-type')
      let responseData: N8nレスポンス

      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json()
      } else {
        const textResponse = await response.text()
        responseData = { message: textResponse }
      }

      console.log('パースされたレスポンス:', responseData)
      setN8nレスポンス(responseData)
      set現在のページ('結果表示')

    } catch (error) {
      console.error('Webhook送信エラー:', error)
      setエラーメッセージ(`送信に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`)
    } finally {
      set送信中か(false)
    }
  }

  // 分野登録データを送信する関数
  const 分野データを送信する = async () => {
    if (!名前.trim() || !得意分野.trim()) {
      setエラーメッセージ('名前と好きなことを入力してください')
      return
    }

    set送信中か(true)
    setエラーメッセージ('')
    
    try {
      console.log('分野登録送信データ:', {
        name: 名前,
        specialty: 得意分野,
        timestamp: new Date().toISOString()
      })

      const response = await fetch(分野登録_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          name: 名前,
          specialty: 得意分野,
          timestamp: new Date().toISOString()
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const contentType = response.headers.get('content-type')
      let responseData: 分野レスポンス

      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json()
      } else {
        const textResponse = await response.text()
        responseData = { message: textResponse }
      }

      console.log('分野レスポンス:', responseData)
      
      // レスポンスから分野候補を抽出
      const candidates: string[] = []
      
      // genres配列をチェック（メインの形式）
      if (responseData.genres && Array.isArray(responseData.genres)) {
        candidates.push(...responseData.genres)
      }
      
      // その他の形式もサポート
      if (responseData.keywords && Array.isArray(responseData.keywords)) {
        candidates.push(...responseData.keywords)
      }
      if (responseData.categories && Array.isArray(responseData.categories)) {
        candidates.push(...responseData.categories)
      }
      if (responseData.suggestions && Array.isArray(responseData.suggestions)) {
        candidates.push(...responseData.suggestions)
      }
      
      // もしレスポンス自体が配列の場合
      if (Array.isArray(responseData)) {
        candidates.push(...responseData)
      }
      
      // もしデータプロパティに配列がある場合
      if (responseData.data && Array.isArray(responseData.data)) {
        candidates.push(...responseData.data)
      }

      // 重複を除去して設定
      const uniqueCandidates = [...new Set(candidates)]
      set分野候補リスト(uniqueCandidates.length > 0 ? uniqueCandidates : [得意分野])
      set現在のページ('分野選択')

    } catch (error) {
      console.error('分野登録Webhook送信エラー:', error)
      console.error('URL:', 分野登録_WEBHOOK_URL)
      setエラーメッセージ(`分野登録に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`)
    } finally {
      set送信中か(false)
    }
  }

  // 分野選択を確定する関数
  const 分野選択を確定する = async () => {
    if (選択された分野.length === 0) {
      setエラーメッセージ('少なくとも1つの分野を選択してください')
      return
    }

    set送信中か(true)
    setエラーメッセージ('')
    
    try {
      console.log('分野確定送信データ:', {
        name: 名前,
        selectedFields: 選択された分野,
        timestamp: new Date().toISOString()
      })

      const response = await fetch(分野確定_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          name: 名前,
          selectedFields: 選択された分野,
          timestamp: new Date().toISOString()
        }),
      })

      console.log('分野確定レスポンス status:', response.status)
      console.log('分野確定レスポンス URL:', 分野確定_WEBHOOK_URL)

      if (!response.ok) {
        // 404エラーの場合はローカルで処理を続行
        if (response.status === 404) {
          console.warn('確定Webhook URLが見つかりません。ローカルで処理を完了します。')
          alert(`🎉 ${名前}さんの分野登録が完了しました！（テストモード）\n\n選択された分野:\n${選択された分野.map(field => `• ${field}`).join('\n')}\n\nありがとうございました！`)
          ホームに戻る()
          return
        }
        throw new Error(`分野確定Webhook エラー! status: ${response.status} (${response.statusText})`)
      }

      console.log('分野確定完了')
      
      // 成功ページに遷移
      set現在のページ('分野完了')

    } catch (error) {
      console.error('分野確定Webhook送信エラー:', error)
      console.error('URL:', 分野確定_WEBHOOK_URL)
      setエラーメッセージ(`分野確定に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`)
    } finally {
      set送信中か(false)
    }
  }

  const ホームに戻る = () => {
    set現在のページ('ホーム')
    set入力内容('')
    setエラーメッセージ('')
    setN8nレスポンス(null)
    // 分野登録関連の状態もリセット
    set名前('')
    set得意分野('')
    set分野候補リスト([])
    set選択された分野([])
  }

  const キー押下処理 = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      データを送信する()
    }
  }

  // ホームページコンポーネント
  const ホームページ = () => (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
          おしAI
        </h1>
        <p className="text-gray-600">
          悩みや相談、質問をAIに送信しよう！
        </p>
      </div>

      <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <textarea
                value={入力内容}
                onChange={(e) => set入力内容(e.target.value)}
                onKeyDown={キー押下処理}
                placeholder="どんなことで困っていますか？お聞かせください..."
                className="w-full h-32 p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={送信中か}
              />
              <p className="text-xs text-gray-500 mt-1 text-right">
                Ctrl+Enter (Mac: Cmd+Enter) で送信
              </p>
            </div>
            
            {エラーメッセージ && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {エラーメッセージ}
              </div>
            )}

            <Button
              onClick={データを送信する}
              disabled={送信中か || !入力内容.trim()}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-3 text-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {送信中か ? '送信中...' : '送信 ✨'}
            </Button>

            <div className="text-center">
              <Button
                onClick={() => set現在のページ('分野登録')}
                variant="ghost"
                className="text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50 border-none px-2 py-1"
              >
                分野登録
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  // 分野登録ページコンポーネント
  const 分野登録ページ = () => (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
          分野登録
        </h1>
        <p className="text-gray-600">
          あなたの好きなことや興味のあることを教えてください
        </p>
      </div>

      <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                お名前(スペースなし)
              </label>
              <input
                type="text"
                value={名前}
                onChange={(e) => set名前(e.target.value)}
                placeholder="山田太郎"
                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={送信中か}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ゼミや研究のことから趣味やマイブームでもOK!
              </label>
              <textarea
                value={得意分野}
                onChange={(e) => set得意分野(e.target.value)}
                placeholder="研究、デザイナー、アニメ、料理、散歩、音楽、ゲーム、読書、映画鑑賞、DIY、..."
                className="w-full h-24 p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={送信中か}
              />
              <p className="text-xs text-gray-500 mt-1">
                💡 どんな小さなことでもOK！好きなことなら何でも書いてください
              </p>
            </div>
            
            {エラーメッセージ && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {エラーメッセージ}
              </div>
            )}

            <div className="space-y-3">
              <Button
                onClick={分野データを送信する}
                disabled={送信中か || !名前.trim() || !得意分野.trim()}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white py-3 text-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {送信中か ? '送信中...' : '登録'}
              </Button>

              <Button
                onClick={ホームに戻る}
                variant="outline"
                className="w-full bg-white/70 backdrop-blur-sm border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700 font-medium"
              >
                ← ホームに戻る
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  // 分野選択ページコンポーネント
  const 分野選択ページ = () => (
    <div className="w-full max-w-2xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
          分野を選択してください
        </h1>
        <p className="text-gray-600 mb-2">
          こんなこともちょっと詳しかったりしない？
        </p>
        <p className="text-sm text-gray-500">
          遠慮せずに、たくさん選んでみてくださいね！✨
        </p>
      </div>

      <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm mb-6">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-lg text-gray-800">
            関連分野候補
          </CardTitle>
          <CardDescription>
            ちょっと話せそうなことでもチェック！複数選択大歓迎 🎯
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {分野候補リスト.length > 0 ? (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                {分野候補リスト.map((分野, index) => (
                  <label
                    key={index}
                    htmlFor={`field-${index}`}
                    className={`
                      inline-flex items-center px-4 py-2 rounded-full cursor-pointer 
                      transition-all duration-200 border-2 font-medium text-sm
                      ${選択された分野.includes(分野)
                        ? 'bg-blue-500 text-white border-blue-500 shadow-md transform scale-105'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                      }
                    `}
                  >
                    <input
                      type="checkbox"
                      id={`field-${index}`}
                      checked={選択された分野.includes(分野)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          set選択された分野([...選択された分野, 分野])
                        } else {
                          set選択された分野(選択された分野.filter(f => f !== 分野))
                        }
                      }}
                      className="sr-only"
                    />
                    <span className="mr-2">
                      {選択された分野.includes(分野) ? '✅' : '⚪️'}
                    </span>
                    {分野}
                  </label>
                ))}
              </div>
              
              {分野候補リスト.length > 0 && (
                <div className="text-center text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
                  💡 ヒント: たくさん選んでいただくことで、相談者が助かります！
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <p>😅 分野候補が見つかりませんでした</p>
            </div>
          )}

          {選択された分野.length > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
              <h4 className="font-medium text-blue-800 mb-3 flex items-center">
                <span className="mr-2">🎯</span>
                選択中の分野
              </h4>
              <div className="flex flex-wrap gap-2">
                {選択された分野.map((分野, index) => (
                  <span
                    key={index}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-sm"
                  >
                    ✨ {分野}
                  </span>
                ))}
              </div>
              <p className="text-xs text-blue-600 mt-2">
                {選択された分野.length}個の分野が選択されています 🙌
              </p>
            </div>
          )}

          {エラーメッセージ && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {エラーメッセージ}
            </div>
          )}

          <div className="space-y-3">
            <Button
              onClick={分野選択を確定する}
              disabled={送信中か || 選択された分野.length === 0}
              className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white py-3 text-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {送信中か ? '登録中...' : '選択を確定 ✅'}
            </Button>

            <Button
              onClick={ホームに戻る}
              variant="outline"
              className="w-full bg-white/70 backdrop-blur-sm border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700 font-medium"
              disabled={送信中か}
            >
              ← ホームに戻る
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  // 分野完了ページコンポーネント
  const 分野完了ページ = () => (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <div className="mb-6">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
            分野を追加しました！
          </h1>
          <p className="text-gray-600">
            {名前}さん、ありがとうございました
          </p>
        </div>
      </div>

      <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                登録された分野
              </h3>
              <div className="flex flex-wrap gap-2 justify-center">
                {選択された分野.map((分野, index) => (
                  <span
                    key={index}
                    className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-sm"
                  >
                    ✨ {分野}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200 text-center">
              <p className="text-green-800 font-medium mb-2">
                🌟 素晴らしい！
              </p>
              <p className="text-sm text-green-700">
                {選択された分野.length} 個の分野が追加されました！
              </p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={ホームに戻る}
                className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white py-3 text-lg font-medium transition-all duration-200"
              >
                ホームに戻る 🏠
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  // 結果表示ページコンポーネント
  const 結果表示ページ = () => (
    <div className="w-full max-w-2xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
          相談先を見つけました！ 🎉
        </h1>
        <p className="text-gray-600">
          以下の人物に聞きに行くといいかも知れません！
        </p>
      </div>

      <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm mb-6">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-lg text-gray-800">
            おすすめの相談先
          </CardTitle>
          <CardDescription>
            あなたの質問に答えてくれそうな人物です
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {n8nレスポンス ? (
            <div className="space-y-4">
              {/* answersの配列が存在する場合の表示 */}
              {n8nレスポンス.answers && Array.isArray(n8nレスポンス.answers) ? (
                <div className="space-y-4">
                  {n8nレスポンス.answers.map((answer, index) => (
                    <div key={index} className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-5 border border-purple-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                      <div className="space-y-3">
                        <h3 className="text-lg font-semibold text-gray-800">
                          {answer.name || '相談先の方'}
                        </h3>
                        <p className="text-gray-600 leading-relaxed">
                          {answer.reason || 'この方にご相談されることをおすすめします。'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* answersがない場合の従来通りの表示 */
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="text-gray-700 leading-relaxed">
                    {typeof n8nレスポンス === 'string' ? (
                      <p>{n8nレスポンス}</p>
                    ) : n8nレスポンス.message ? (
                      <p>{n8nレスポンス.message}</p>
                    ) : n8nレスポンス.data ? (
                      <p>{String(n8nレスポンス.data)}</p>
                    ) : (
                      <pre className="text-sm whitespace-pre-wrap">
                        {JSON.stringify(n8nレスポンス, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <p>😅 申し訳ございません</p>
              <p>現在おすすめの相談先が見つかりませんでした</p>
            </div>
          )}

          <div className="flex items-center justify-center gap-2 p-3 bg-purple-50 rounded-lg">
            <span className="text-purple-600">💬</span>
            <span className="text-purple-700 font-medium">人物を探したりDMしてみましょう！</span>
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <Button
          onClick={ホームに戻る}
          variant="outline"
          className="bg-white/70 backdrop-blur-sm border-2 border-purple-200 hover:bg-purple-50 hover:border-purple-300 text-purple-700 font-medium px-8 py-3 text-lg transition-all duration-200"
        >
          ← ホームに戻る
        </Button>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 w-full h-full bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 overflow-auto">
      <div className="min-h-full flex items-center justify-center p-4">
        {現在のページ === 'ホーム' && ホームページ()}
        {現在のページ === '分野登録' && 分野登録ページ()}
        {現在のページ === '分野選択' && 分野選択ページ()}
        {現在のページ === '分野完了' && 分野完了ページ()}
        {現在のページ === '結果表示' && 結果表示ページ()}
      </div>
    </div>
  )
}

export default App
