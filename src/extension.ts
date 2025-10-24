import {
  activateAutoInsertion,
  activateDocumentDropEdit,
  createLabsInfo,
} from '@volar/vscode'
import { LanguageClient, TransportKind } from '@volar/vscode/node'
import path from 'path'
import {
  commands,
  env,
  type DocumentSelector,
  type ExtensionContext,
} from 'vscode'
import { getExtConfig } from './config'
import { logger } from './util/logger'

export async function activate(context: ExtensionContext) {
  const selector = (
    context.extension.packageJSON.contributes.typescriptServerPlugins[0]
      .languages as string[]
  ).map((language) => ({ language, scheme: 'file' })) as DocumentSelector
  let serverPath = getExtConfig('server.path')
  if (!serverPath || !path.isAbsolute(serverPath)) {
    serverPath = context.asAbsolutePath('dist/vueLanguageServerMain.js')
  }
  const args = [
    '--tsdk=' +
      path.join(env.appRoot, 'extensions/node_modules/typescript/lib'),
  ]
  const client = new LanguageClient(
    'Vue',
    {
      run: {
        module: serverPath,
        args,
        transport: TransportKind.ipc,
        options: {},
      },
      debug: {
        module: serverPath,
        args,
        transport: TransportKind.ipc,
        options: { execArgv: ['--nolazy', '--inspect=' + 6009] },
      },
    },
    {
      documentSelector: selector as any,
      markdown: {
        isTrusted: true,
        supportHtml: true,
      },
      outputChannel: logger,
    }
  )
  await client.start()
  context.subscriptions.push(
    logger,
    client,
    client.onNotification('tsserver/request', ([seq, command, args]) =>
      commands
        .executeCommand('typescript.tsserverRequest', command, args, {
          isAsync: true,
          lowPriority: true,
        })
        .then(
          (res) =>
            client.sendNotification('tsserver/response', [
              seq,
              (res as any)?.body,
            ]),
          () => client.sendNotification('tsserver/response', [seq, undefined])
        )
    ),
    activateAutoInsertion(selector, client),
    activateDocumentDropEdit(selector, client),
    commands.registerCommand('vue.action.restartLanguageServer', async () => {
      await commands.executeCommand('typescript.restartTsServer')
      if (client) {
        await client.stop()
        await client.start()
      }
    })
  )
  const volarLabs = createLabsInfo()
  volarLabs.addLanguageClient(client)
  return volarLabs.extensionExports
}
