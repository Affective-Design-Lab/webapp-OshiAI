import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import './App.css'

// ページの状態を管理する型
type ページ状態 = 'ホーム' | '結果表示'

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

function App() {
  const [現在のページ, set現在のページ] = useState<ページ状態>('ホーム')
  const [入力内容, set入力内容] = useState('')
  const [送信中か, set送信中か] = useState(false)
  const [エラーメッセージ, setエラーメッセージ] = useState('')
  const [n8nレスポンス, setN8nレスポンス] = useState<N8nレスポンス | null>(null)

  // n8n Webhookエンドポイント（設定可能）
  const WEBHOOK_URL = 'https://yn8n.app.n8n.cloud/webhook/61727c55-fe17-47b8-9426-e3babba284ca'

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

  const ホームに戻る = () => {
    set現在のページ('ホーム')
    set入力内容('')
    setエラーメッセージ('')
    setN8nレスポンス(null)
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
        {現在のページ === 'ホーム' ? ホームページ() : 結果表示ページ()}
      </div>
    </div>
  )
}

export default App
