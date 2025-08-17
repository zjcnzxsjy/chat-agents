import {
  XIcon,
  SendHorizontal,
  RefreshCcw,
  Pencil,
  Copy,
  CopyCheck,
  ChevronLeft,
  ChevronRight,
  Volume2,
  AudioLines,
} from "lucide-react";
import { TooltipIconButton } from "@/components/ui/tooltip-icon-button";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { VoiceIconButton } from "@/components/ui/voice-icon-button";
import { VoiceStreamContextType } from "@/features/chat/providers/Stream";
import { createWavBlob } from "@/features/chat/utils/audio";

function ContentCopyable({
  content,
  disabled,
}: {
  content: string;
  disabled: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.stopPropagation();
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <TooltipIconButton
      onClick={(e) => handleCopy(e)}
      variant="ghost"
      tooltip="Copy content"
      disabled={disabled}
    >
      <AnimatePresence
        mode="wait"
        initial={false}
      >
        {copied ? (
          <motion.div
            key="check"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
          >
            <CopyCheck className="text-green-500" />
          </motion.div>
        ) : (
          <motion.div
            key="copy"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
          >
            <Copy />
          </motion.div>
        )}
      </AnimatePresence>
    </TooltipIconButton>
  );
}

export function BranchSwitcher({
  branch,
  branchOptions,
  onSelect,
  isLoading,
}: {
  branch: string | undefined;
  branchOptions: string[] | undefined;
  onSelect: (branch: string) => void;
  isLoading: boolean;
}) {
  if (!branchOptions || !branch) return null;
  const index = branchOptions.indexOf(branch);

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        className="size-6 p-1"
        onClick={() => {
          const prevBranch = branchOptions[index - 1];
          if (!prevBranch) return;
          onSelect(prevBranch);
        }}
        disabled={isLoading}
      >
        <ChevronLeft />
      </Button>
      <span className="text-sm">
        {index + 1} / {branchOptions.length}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="size-6 p-1"
        onClick={() => {
          const nextBranch = branchOptions[index + 1];
          if (!nextBranch) return;
          onSelect(nextBranch);
        }}
        disabled={isLoading}
      >
        <ChevronRight />
      </Button>
    </div>
  );
}

function VoiceButton({
  content,
  disabled,
  voiceStream,
}: {
  content: string;
  disabled: boolean;
  voiceStream?: VoiceStreamContextType;
}) {
  const [base64Audio, setBase64Audio] = useState<string | null>(null);
  const [podcastUrl, setPodcastUrl] = useState<string>("");
  // const podcastUrl = useMemo(() => {
  //   const base64Audio = voiceStream?.values?.ttsOutput?.audioData ?? "";
  //   if (!base64Audio || base64Audio.length === 0) {
  //     return "";
  //   }
  //   try {
  //     // google的语音解析处理，网上一般的方法都会报错
  //     const wavBlob = createWavBlob(base64Audio!);
  //     // Create an object URL from the Blob
  //     const audioUrl = URL.createObjectURL(wavBlob);
  //     return audioUrl;
  //   } catch (blobError) {
  //     throw new Error('Failed to create audio blob');
  //   }
  // }, [voiceStream?.values?.ttsOutput?.audioData]);

  const handleClick = async(status: string) => {
    console.log("podcastUrl", status, podcastUrl);
    if (status === "init" && !podcastUrl) {
      // voiceStream?.submit({
      //   researchText: "为了让你学得更轻松高效，我为你规划了一个学习计划，主要分为三个大主题，你看怎么样？\n\n我的学习计划建议：\n\n主题一：汉字与拼音城堡探险 (识字与拼音基础)\n\n我们会一起学习课本里所有的生字，包括“识字”部分 (比如 \"春夏秋冬\", \"姓氏歌\"  等) 和每篇课文后面要求认识的字 (比如《吃水不忘挖井人》里的生字 )。\n\n我们还会练习写字，特别是“写字表”里的字 ，注意正确的笔顺哦，课本里的“书写提示”  会帮助我们。\n\n当然，我们也会巩固汉语拼音，这可是我们认识汉字的好帮手，特别是“语文园地一”里的“汉语拼音字母表” 。\n\n我们还会认识一些常用的偏旁部首，就像认识了乐高积木的零件，能帮助我们更好地理解和记忆汉字 (\"常用偏旁名称表\" )。\n\n主题二：故事花园漫步 (阅读与理解能力)\n\n我们会一篇一篇地学习课文 (比如《我多想去看看》, 《四个太阳》, 《小公鸡和小鸭子》 等等，一直到最后的《小壁虎借尾巴》)。\n\n我会引导你理解每篇课文讲了什么，学习新的词语，并且能够朗读和复述课文。很多课文后面都有“朗读课文。背诵课文。”的要求 ，我们会一起完成。\n\n我们还会特别关注“语文园地”中的“字词句运用”  和“日积月累” ，积累更多优美的词句和有趣的知识。\n\n主题三：交际小舞台与阅读大世界 (口语表达与拓展)\n\n我们会一起完成“口语交际”部分的练习 (比如 \"听故事, 讲故事\", \"请你帮个忙\", \"打电话\", \"一起做游戏\" )，让你在实际情境中练习说话。\n\n我们还会探索“快乐读书吧” ，读读童谣和儿歌，感受阅读的乐趣。\n\n课本里还有很多“和大人一起读”的有趣故事 (比如 \"谁和谁好\", \"阳光\", \"小熊住山洞\" )，我们可以一起分享和讨论。\n\n我们还会学习怎么查字典 (\"语文园地三\" )，这是一项非常重要的学习技能哦！\n\n这个学习计划你觉得怎么样？有没有什么想调整或者特别想先开始学习的部分呢？告诉我你的想法，我们可以一起修改和完善它！",
      // });
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
        })
      })
      const { audio } = await response.json()
      setBase64Audio(audio)
    }
  };

  useEffect(() => {
    if (!base64Audio || base64Audio.length === 0) {
      return
    }
    let binaryString: string;
    let audioBlob: Blob;
    let audioUrl: string;
    
    try {
      binaryString = atob(base64Audio);
    } catch (decodeError) {
      console.error('🎵 Base64 decode failed:', decodeError);
      throw new Error('Invalid base64 audio format');
    }
    try {
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      audioBlob = new Blob([bytes], { type: 'audio/wav' });
      audioUrl = URL.createObjectURL(audioBlob);
      console.log('🎵 Created blob URL:', audioUrl);
      setPodcastUrl(audioUrl)
    } catch (blobError) {
      throw new Error('Failed to create audio blob');
    }
  }, [base64Audio])

  return <VoiceIconButton disabled={disabled && voiceStream?.isLoading} audioSrc={podcastUrl} onClick={handleClick} />;
}

export function CommandBar({
  content,
  isHumanMessage,
  isAiMessage,
  isEditing,
  setIsEditing,
  handleSubmitEdit,
  handleRegenerate,
  isLoading,
  voiceStream,
}: {
  content: string;
  isHumanMessage?: boolean;
  isAiMessage?: boolean;
  isEditing?: boolean;
  setIsEditing?: React.Dispatch<React.SetStateAction<boolean>>;
  handleSubmitEdit?: () => void;
  handleRegenerate?: () => void;
  isLoading: boolean;
  voiceStream?: VoiceStreamContextType
}) {
  if (isHumanMessage && isAiMessage) {
    throw new Error(
      "Can only set one of isHumanMessage or isAiMessage to true, not both.",
    );
  }

  if (!isHumanMessage && !isAiMessage) {
    throw new Error(
      "One of isHumanMessage or isAiMessage must be set to true.",
    );
  }

  if (
    isHumanMessage &&
    (isEditing === undefined ||
      setIsEditing === undefined ||
      handleSubmitEdit === undefined)
  ) {
    throw new Error(
      "If isHumanMessage is true, all of isEditing, setIsEditing, and handleSubmitEdit must be set.",
    );
  }

  const showEdit =
    isHumanMessage &&
    isEditing !== undefined &&
    !!setIsEditing &&
    !!handleSubmitEdit;

  if (isHumanMessage && isEditing && !!setIsEditing && !!handleSubmitEdit) {
    return (
      <div className="flex items-center gap-2">
        <TooltipIconButton
          disabled={isLoading}
          tooltip="Cancel edit"
          variant="ghost"
          onClick={() => {
            setIsEditing(false);
          }}
        >
          <XIcon />
        </TooltipIconButton>
        <TooltipIconButton
          disabled={isLoading}
          tooltip="Submit"
          variant="secondary"
          onClick={handleSubmitEdit}
        >
          <SendHorizontal />
        </TooltipIconButton>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <ContentCopyable
        content={content}
        disabled={isLoading}
      />
      {isAiMessage && !!handleRegenerate && (
        <TooltipIconButton
          disabled={isLoading}
          tooltip="Refresh"
          variant="ghost"
          onClick={handleRegenerate}
        >
          <RefreshCcw />
        </TooltipIconButton>
      )}
      {showEdit && (
        <TooltipIconButton
          disabled={isLoading}
          tooltip="Edit"
          variant="ghost"
          onClick={() => {
            setIsEditing?.(true);
          }}
        >
          <Pencil />
        </TooltipIconButton>
      )}
      {isAiMessage && (
        <VoiceButton content={content} disabled={isLoading} voiceStream={voiceStream} />
      )}
    </div>
  );
}
