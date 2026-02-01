const TelegramBot           = require('node-telegram-bot-api');
const { createWriteStream } = require("node:fs");
const { appendFile }        = require('node:fs/promises');
const { join }              = require("node:path")
const { spawn }             = require('child_process');
const { DailyBread }        = require("daily-bread");


const bot = new TelegramBot( process.env.BOT_TOKEM, { polling: true } );
async function sendMedia(chatID, fileAudio)
    {
        const date     = new Date();
        const filename = `${date.getFullYear()}${date.getMonth()}${date.getDay()}${date.getHours()}${date.getMinutes()}${date.getSeconds()}`
        const options = [
            '-loop', '1',
            '-i', './input/base.jpg',
            '-i', fileAudio,
            '-stream_loop', '-1',           // Loop INFINITO do vídeo da senoide
            '-i', './input/voice-memo.gif', // Seu vídeo de 1 segundo
            '-filter_complex',
            '[0:v]scale=1080:1920:force_original_aspect_ratio=decrease,' +
            'pad=1080:1920:(ow-iw)/2:(oh-ih)/2[bg];' +
            '[2:v]scale=800:-1[wave];' +    // Apenas redimensiona
            '[bg][wave]overlay=W/2-w/2:H-h-1[v]',
            '-map', '[v]',
            '-map', '1:a',
            '-c:v', 'libx264',
            '-c:a', 'aac',
            '-b:a', '128k',
            '-pix_fmt', 'yuv420p',
            '-shortest',                    // Termina quando o áudio acabar
            `./output/${filename}.mp4`
        ];

        const listener = spawn( "ffmpeg", options )
        listener.stderr.on( "data", (data) => {
            appendFile("logFfmpeg.txt", `${data.toString()}\n`)
        })
        listener.on( "close", async () => {
            await bot.sendVideo( chatID, `./output/${filename}.mp4`)
        })
    }

bot.on('message', async (msg) => {
    console.log(msg);


    if(msg.text && msg.chat.id === 466573943)
        {
            const bible = new DailyBread();
            bible.setVersion( "NVI-PT" );
            const { reference, text } = await bible.votd()

            const txtFormatted = `*🍞 Pão Diário*\n\n${text}\n\n*${reference}*`
            await bot.sendMessage( msg.chat.id, txtFormatted )

        }
    else if(msg.voice)
        {
            const fileID = msg.voice?.file_id
            const chatID = msg.chat.id

            await bot.sendAnimation(chatID, "./input/lina-poe-lalafell.gif")

            const fileStream    = bot.getFileStream( fileID );
            const filePath      = join(__dirname, 'input', 'voices', `${fileID}.ogg`);

            fileStream
                .pipe(createWriteStream( filePath ))
                .on('finish',   async () => await sendMedia(chatID, filePath) )
                .on('error',    async (err) => {
                    console.error(`Erro ao baixar o arquivo: ${err}`);
                    await bot.sendMessage(chatID, "problema no donwload, contate o suporte!");
                });

        }
    else if(msg.document && msg.document?.mime_type.includes("image") === true)
        {

            // 0 = width : 90 height : 30
            // 1 = width : 320 height : 105
            // 2 = width : 800 height : 262
            // 3 = width : 1280 height : 420

            const fileID    = msg.document["file_id"];
            const mimeType  = msg.document.mime_type.split("/")[1];
            const chatID    = msg.chat.id;
            const fileStream  = bot.getFileStream( fileID );
            const filePath    = join(__dirname, 'input', `base.jpg`);

            fileStream
                .pipe(createWriteStream( filePath ))
                .on('finish',   async () => await bot.sendMessage( chatID, "Imagem salva, agora envie o audio! 😁" ) )
                .on('error',    async (err) => {
                    console.error(`Erro ao baixar o arquivo: ${err}`);
                    await bot.sendMessage(chatID, "problema no donwload, contate o suporte!");
                });

        }
    else
        {

            await bot.sendMessage( msg.chat.id, "Envie uma mensagem de voz ou uma imagem para processar! 😁" )
            return
        }


});

//       const options = [
//     '-loop', '1',               // Faz a imagem se repetir (loop)
//     '-i', './input/base.jpg',  // Imagem de entrada
//     '-i', fileAudio,            // Áudio de entrada
//     '-vf', 'scale=1600:900',    // Redimensiona para 1600x900 (altura ajustada para ser divisível por 2)
//     '-c:v', 'libx264',          // Codec de vídeo
//     '-t', '3.5',                // Define a duração do vídeo (igual à duração do áudio)
//     '-c:a', 'aac',              // Codec de áudio
//     '-b:a', '128k',             // Taxa de bits do áudio
//     '-pix_fmt', 'yuv420p',      // Formato de pixel para compatibilidade
//     '-shortest',                // Faz o vídeo ter a mesma duração do áudio
//     `./output/${filename}.mp4`  // Arquivo de saída
// ];

// const options = [
//     '-loop', '1',               // Faz a imagem se repetir (loop)
//     '-i', './input/base.jpg',  // Imagem de entrada
//     '-i', fileAudio,            // Áudio de entrada
//     '-vf', 'scale=1600:900',    // Redimensiona para 1600x900 (altura ajustada para ser divisível por 2)
//     '-c:v', 'libx264',          // Codec de vídeo
//     '-t', '3.5',                // Define a duração do vídeo (igual à duração do áudio)
//     '-c:a', 'aac',              // Codec de áudio
//     '-b:a', '128k',             // Taxa de bits do áudio
//     '-pix_fmt', 'yuv420p',      // Formato de pixel para compatibilidade
//     '-shortest',                // Faz o vídeo ter a mesma duração do áudio
//     `./output/${filename}.mp4`  // Arquivo de saída
// ];
