import pyaudio
import wave
from pydub import AudioSegment
import openai
import sys
import os

CHUNK = 1024
FORMAT = pyaudio.paInt16
CHANNELS = 1
RATE = 44100
OUTPUT_MP3_DIRECTORY = "C:/Users/hp/Downloads"

def convert_wav_to_mp3(wav_filename, mp3_filename):
    sound = AudioSegment.from_file(wav_filename)
    sound.export(mp3_filename, format="mp3")
    os.remove(wav_filename)  # Delete the WAV file

def transcribe_audio(api_key, mp3_filename):
    openai.api_key = api_key
    audio_file = open(mp3_filename, "rb")
    transcript = openai.Audio.transcribe("whisper-1", audio_file)
    return transcript.text

def main():
    if len(sys.argv) < 3:
        print("Usage: python script.py --input input.wav")
        return

    input_wav_filename = sys.argv[2]
    mp3_filename = os.path.join(OUTPUT_MP3_DIRECTORY, "output.mp3")

    # Convert WAV to MP3
    convert_wav_to_mp3(input_wav_filename, mp3_filename)

    # Set your OpenAI API key
    api_key = "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"

    # Transcribe audio
    transcription = transcribe_audio(api_key, mp3_filename)
    print(transcription)

if __name__ == "__main__":
    main()
