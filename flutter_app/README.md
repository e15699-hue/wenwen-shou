# 問問獸 Flutter App（骨架 v0.1）

兒童 AI 語音家教 App，iOS 優先、之後 Android，共用同一套 Flutter 程式碼。

## 專案結構

```
lib/
  main.dart                  # App 入口＋路由（首頁→拍照→對話→家長報告）
  screens/
    home_screen.dart         # 首頁：大按鈕開始＋家長報告入口
    camera_screen.dart       # 拍照＋魔法放大鏡框題（TODO: image_picker＋框選）
    chat_screen.dart         # 三關卡蘇格拉底對話（TODO: 串 gemini_service）
    parent_report_screen.dart# 家長學情小紙條（TODO: 串 Supabase）
  widgets/
    monster_avatar.dart      # 問問獸頭像（TODO: 換 Rive 動畫）
    choice_buttons.dart      # 雙選項大按鈕
    voice_button.dart        # 按住說話按鈕（TODO: speech_to_text）
  services/
    gemini_service.dart      # Gemini API（模型順序與網頁 PoC 一致，503 重試）
    speech_service.dart      # STT＋TTS（TODO: 實作）
```

## 核心原則（不可違反）

- **死不給答案**：AI 絕對禁止說出任何計算結果（含中間步驟），小孩必須自己算每一個數字
- **API Key 不進 App**：正式版走 Supabase Edge Functions 代理；`gemini_service.dart` 的 `apiKey` 參數僅開發測試用
- **輕量省錢模型**：`gemini-3.5-flash-lite` 優先，依序備援（見 `gemini_service.dart`）

## 如何運行

```bash
export PATH="$HOME/workspace/flutter-sdk/bin:$PATH"
cd flutter_app
flutter pub get
flutter analyze   # 應無錯誤
flutter run       # 需接 Android 裝置或模擬器；iOS 需 macOS＋Xcode（用 Codemagic 雲端編譯）
```

## 注意事項

- Linux 無法本機編譯 iOS，上架用 Codemagic 等雲端 Mac
- Apple Developer 帳號需使用者本人申請（年費 US$99）
- Rive 動畫檔（`assets/wenwen.riv`）待設計師提供，目前用 🦖 emoji 佔位
