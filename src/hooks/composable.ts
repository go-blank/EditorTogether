import { ref, watch, onUnmounted } from 'vue';
import * as Y from 'yjs';
import { HocuspocusProvider } from '@hocuspocus/provider';
import { useEditor } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import { eventBus } from '../../utils/eventBus.js'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
const router = useRouter()

export interface UseCollaborativeEditorOptions {
  documentId: string;
  token: string;
  username?: string;
  userColor?: string;
  initialContent?: string;
  editable?: boolean;
}

let timer: NodeJS.Timeout | null = null

function debounceUpdate() {
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    console.log("开始发送事件")
    eventBus.emit('updateDocumentRecord')
  }, 5000)
}

export function useCollaborativeEditor(options: UseCollaborativeEditorOptions) {
  const {
    documentId,
    token,
    username = '匿名用户',
    userColor = `#${Math.floor(Math.random() * 16777215).toString(16)}`,
    initialContent = '<p>开始协作编辑...</p>',
    editable = true
  } = options;
  // console.log("传进来的数据是", documentId)

  const isConnected = ref(false);
  const isSynced = ref(false);
  const error = ref<string | null>(null);
  const shouldGoBack = ref(false)

  let provider: HocuspocusProvider | null = null;
  let yDoc: Y.Doc | null = null;

  // 创建 Yjs 文档和 Provider
  const initCollaboration = () => {

    // 清理旧实例
    if (provider) {
      provider.destroy();
      provider = null;
    }
    if (yDoc) {
      yDoc.destroy();
      yDoc = null;
    }

    if (!documentId || !token) {
      error.value = '缺少文档ID或token';
      return null;
    }

    // 创建 Yjs 文档
    yDoc = new Y.Doc();
    // console.log("传递的参数分别是", "documentId", documentId, "token", token)

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    
//
    // 创建 Hocuspocus Provider
    provider = new HocuspocusProvider({
      url: `${protocol}//${window.location.host}/collaboration/${documentId}?token=${token}`,  
      name: documentId,
      token: token,
      document: yDoc,


      onAuthenticated() {
        console.log('✅ 认证成功！');
      },

      onClose: ({ event }) => {
        console.log('WebSocket 关闭, code:', event.code);
        // 服务端主动关闭连接，通常是权限问题或文档不存在
        // 注意：需要区分是正常关闭还是错误关闭
        if (event.code === 1000) {
          // 1000 是正常关闭，不需要处理
          return;
        }
        // 其他关闭码可能是服务端 reject 导致的
        ElMessage.error('文档连接失败，文档可能已被删除');
        shouldGoBack.value = true;
      },

      onConnect: () => {
        // console.log('✅ 已连接到协作服务器');
        // console.log("传递的参数分别是", "documentId", documentId, "token", token)
        isConnected.value = true;
        error.value = null;
        // console.log("状态变化是否连接成功", isConnected.value)
      },

      onDisconnect: () => {
        console.log('❌ 连接已断开');
        isConnected.value = false;
        isSynced.value = false;
      },

      onSynced: () => {
        console.log('✅ 文档已同步');
        isSynced.value = true;
        // console.log("状态变化是否同步成功", isSynced.value)
      },
      // onAwarenessChange: ({ state }) => {
      //   console.log("文档状态发生改变")
      //   debounceUpdate()
      // }

    });

    return yDoc;
  };

  // 初始化协同
  const res = initCollaboration()
  if (!res) {
    return { error }
  }

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
  });

  // 根据权限控制编辑器可编辑状态
  watch(editor, (editorInstance) => {
    if (editorInstance) {
      editorInstance.setEditable(editable);
    }
  }, { immediate: true });


  // 监听文档被删除的通知
  const handleDocDeleted = (notif) => {
    if (notif.docId === documentId && (notif.action === 'Rdelete' || notif.action === 'Cdelete')) {
      ElMessageBox.alert(
        '该文档已被创建者删除，即将返回文档列表',
        '文档已被删除',
        { confirmButtonText: '确定', type: 'warning', callback: () => { shouldGoBack.value = true; } }
      )
    }
  }
  eventBus.on('notification:new', handleDocDeleted)


  onUnmounted(() => {
    if (editor.value) {
      editor.value.destroy();
    }

    if (provider) {
      provider.destroy();
      provider = null;
    }

    if (yDoc) {
      yDoc.destroy();
      yDoc = null;
    }

    // 清理通知监听
    eventBus.off('notification:new', handleDocDeleted);
  });

  return {
    editor,
    isConnected,
    isSynced,
    error,
    shouldGoBack
  };
}