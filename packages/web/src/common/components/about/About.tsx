import { Info } from 'lucide-react';
import { JSX } from 'react';

import { Button } from '@/common/components/shadcn/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/common/components/shadcn/sheet';

/**
 *
 * @returns
 */
export const About = (): JSX.Element => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="About this project" title="About this project">
          <Info className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">About this project</span>
        </Button>
      </SheetTrigger>
      <SheetContent showCloseButton={false}>
        <SheetHeader>
          <SheetTitle>About Talent Finder</SheetTitle>
          <SheetDescription>An AI-powered portfolio project</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 px-4">
          <div>
            This portfolio project is designed to demonstrate the capabilities of an AI knowledge base and RAG
            (Retrieval-Augmented Generation) in the context of talent acquisition and recruitment. Talent Finder
            showcases how AI can be used to analyze and evaluate candidate profiles, helping staffing managers make
            informed decisions.
          </div>
          <div>
            Amazon Bedrock is used to power the AI capabilities of Talent Finder. Pinecone is used for vector database
            management. It serves as a practical example of how to bring together AI knowledge bases and RAG techniques
            with system prompts and structured outputs to overcome real-world challenges.
          </div>
          <div>
            The project is available on GitHub, where you can find the source code and documentation. It includes
            instructions for getting started, system documentation, and examples of how to use the tool.
          </div>
          <div>
            For more information, visit the{' '}
            <a
              href="https://github.com/mwarman/talent-finder"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 underline"
            >
              GitHub repository
            </a>
            .
          </div>
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline">Close</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
