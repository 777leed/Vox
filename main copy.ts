import { App, Modal, Plugin, PluginSettingTab, Setting, MarkdownView } from 'obsidian';
import { ExecException, exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';


function runPythonScript(inputWavPath: any, callback: (arg0: ExecException | null, arg1: string | null) => void) {
  const pythonScriptPath = "C:/Users/hp/Downloads/LeedMakesStuff/whisper/cmdwhisper.py";
  const command = `python "${pythonScriptPath}" --input "${inputWavPath}"`;
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error('Error executing Python script:', error);
      callback(error, null);
      return;
    }

    // Capture the Python script's output
    const output = stdout.trim();
    callback(null, output);
  });
}

interface MyPluginSettings {
  mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
  mySetting: 'default'
}

export default class MyPlugin extends Plugin {
  settings: MyPluginSettings;

  async onload() {
    await this.loadSettings();

    this.addCommand({
      id: 'open-recording-modal',
      name: 'Open Recording Modal',
      callback: () => {
        new RecordingModal(this.app).open();
      }
    });

    this.addSettingTab(new SampleSettingTab(this.app, this));
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

class RecordingModal extends Modal {
  constructor(app: App) {
    super(app);
  }

  onOpen() {
    const { contentEl } = this;

    const textDiv = contentEl.createDiv();
    textDiv.addClass('recording-text');
    textDiv.setText('Press Record to start');
    textDiv.style.textAlign = 'center';
    textDiv.style.marginBottom = '20px';

    const recordButton = contentEl.createEl('button', { text: 'Record' });
    recordButton.addClass('record-button');
    recordButton.style.display = 'block';
    recordButton.style.margin = '0 auto';

    let mediaRecorder: MediaRecorder | null = null;
    let audioChunks: Blob[] = [];
    let isRecording = false;

    recordButton.onClickEvent(() => {
      if (isRecording) {
        mediaRecorder?.stop();
        isRecording = false;
        textDiv.setText('Recording stopped.');
        recordButton.setText('Record');
      } else {
        isRecording = true;
        textDiv.setText('Recording...');
        recordButton.setText('Stop');

        audioChunks = [];
        navigator.mediaDevices.getUserMedia({ audio: true })
          .then((stream) => {
            mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.ondataavailable = (event) => {
              if (event.data.size > 0) {
                audioChunks.push(event.data);
              }
            };
            mediaRecorder.onstop = async () => {
              const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
              this.saveAudioToFile(audioBlob); // Save audio to file
              
            };
            mediaRecorder.start();
          })
          .catch((error) => {
            console.error('Error accessing microphone:', error);
          });
      }
    });
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }

  async insertText(text: any) {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (activeView) {
      const editor = activeView.editor;
      // Insert the Markdown at the current cursor position in the note
      await editor.replaceSelection(text);
    }
  }

  async saveAudioToFile(audioBlob: Blob) {
    const desktopDirectory = 'C:\\Users\\hp\\Desktop';  // Change this to your desired directory
    const audioFilePath = path.join(desktopDirectory, 'recorded-audio.wav');

    try {
      const audioBuffer = Buffer.from(await audioBlob.arrayBuffer());
      fs.writeFileSync(audioFilePath, audioBuffer);
      this.contentEl.createEl('p').setText('Recording saved to desktop.');

      runPythonScript('C:/Users/hp/Desktop/recorded-audio.wav', (error, output) => {
        if (error) {
          console.error('Error running Python script:', error);
          this.contentEl.createEl('p').setText("error script V");
          this.insertText(error.message)
          // Handle the error, if needed
          return;
        }

        // Use the output as needed
        // console.log('Python script output:', output);
        this.insertText(output)
        this.contentEl.createEl('p').setText('NO ERROR');

        
        // You can update your UI with the output or perform any other action
      });

    } catch (error) {
      console.error('Error saving audio:', error);
      this.contentEl.createEl('p').setText('Error saving recording.');
    }
  }

  

  
}


class SampleSettingTab extends PluginSettingTab {
  plugin: MyPlugin;

  constructor(app: App, plugin: MyPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    new Setting(containerEl)
      .setName('Setting #1')
      .setDesc("It's a secret")
      .addText(text => text
        .setPlaceholder('Enter your secret')
        .setValue(this.plugin.settings.mySetting)
        .onChange(async (value) => {
          this.plugin.settings.mySetting = value;
          await this.plugin.saveSettings();
        }));
  }
}
