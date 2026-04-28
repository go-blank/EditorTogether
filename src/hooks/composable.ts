import { ref, onUnmounted } from 'vue';
import * as Y from 'yjs';
import { HocuspocusProvider } from '@hocuspocus/provider';
import { useEditor } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';

export interface UseCollaborativeEditorOptions {
  documentId: string;
  token: string;
  username?: string;
  userColor?: string;
  initialContent?: string;
}

export function useCollaborativeEditor(options: UseCollaborativeEditorOptions) {
  const {
    documentId,
    token,
    username = '匿名用户',
    userColor = `#${Math.floor(Math.random() * 16777215).toString(16)}`,
    initialContent = '<p>开始协作编辑...</p>'
  } = options;

  const isConnected = ref(false);
  const isSynced = ref(false);
  const error = ref<string | null>(null);
  
  let provider: HocuspocusProvider | null = null;
  let yDoc: Y.Doc | null = null;

  // 创建 Yjs 文档和 Provider
  const initCollaboration = () => {
    if (!documentId || !token) {
      error.value = '缺少文档ID或token';
      return null;
    }

    // 创建 Yjs 文档
    yDoc = new Y.Doc();
    console.log("传递的参数分别是","documentId",documentId,"token",token)

    
    // 创建 Hocuspocus Provider
    provider = new HocuspocusProvider({
      url: `ws://localhost:3001/${documentId}?token=${token}`,  // 你的 WebSocket 地址
      name: documentId,
      token: token,
      document: yDoc,
      
      onConnect: () => {
        console.log('✅ 已连接到协作服务器');
        console.log("传递的参数分别是","documentId",documentId,"token",token)
        debugger
        isConnected.value = true;
        error.value = null;
      },
      
      onDisconnect: () => {
        console.log('❌ 连接已断开');
        isConnected.value = false;
        isSynced.value = false;
      },
      
      onSynced: () => {
        console.log('✅ 文档已同步');
        isSynced.value = true;
      },
    });
    
    return yDoc;
  };

  // 创建 Tiptap 编辑器
  const editor = useEditor({
    content: initialContent,
    extensions: [
      StarterKit.configure({
        history: false, // 禁用默认历史记录，使用 Yjs 的协同历史
      }),
      Collaboration.configure({
        document: yDoc || undefined,
        field: 'content',  // 存储字段名，对应 Y.Doc 中的字段
      }),
      CollaborationCursor.configure({
        provider: provider || undefined,
        user: {
          name: username,
          color: userColor,
        },
      }),
    ],
    onUpdate: ({ editor }) => {
      // 可选：监听本地更新
      console.log('内容已更新');
    },
  });

  // 初始化协同
  initCollaboration();

  // 清理
  onUnmounted(() => {
    if (provider) {
      provider.destroy();
    }
    if (yDoc) {
      yDoc.destroy();
    }
    if (editor.value) {
      editor.value.destroy();
    }
  });

  return {
    editor,
    isConnected,
    isSynced,
    error,
  };
}