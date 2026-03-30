import { Info, ExternalLink, BookOpen, Ruler, Image as ImageIcon, FileCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export function KDPEducationalPanel() {
  return (
    <Card className="border-2 border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display">
          <img 
            src="/assets/generated/educational-tooltip-boho-transparent.png" 
            alt="" 
            className="h-5 w-5"
          />
          Amazon KDP Best Practices
        </CardTitle>
        <CardDescription>Guidelines for professional print quality</CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="trim-bleed">
            <AccordionTrigger className="text-sm">
              <div className="flex items-center gap-2">
                <Ruler className="h-4 w-4" />
                Trim Size & Bleed
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                <strong>Trim Size:</strong> The final size of your book after printing and cutting. 
                This app uses 8.5×8.5" (square format), a standard for children's books on Amazon KDP.
              </p>
              <p>
                <strong>Bleed:</strong> Extra 0.125" around all edges where images/backgrounds extend 
                beyond the trim line. This prevents white edges if cutting is slightly off.
              </p>
              <div className="rounded-lg border border-border bg-secondary/30 p-2 text-xs">
                <p className="font-semibold">✓ Do:</p>
                <ul className="list-inside list-disc">
                  <li>Extend backgrounds to bleed edge</li>
                  <li>Keep important content in safe zone</li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="safe-margins">
            <AccordionTrigger className="text-sm">
              <div className="flex items-center gap-2">
                <img 
                  src="/assets/generated/safe-zone-boho-overlay-transparent.png" 
                  alt="" 
                  className="h-4 w-4"
                />
                Safe Margins
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                Keep all important text and images at least 0.5" from the trim edge. 
                This ensures nothing critical gets cut during printing.
              </p>
              <div className="rounded-lg border border-border bg-secondary/30 p-2 text-xs">
                <p className="font-semibold">Safe Zone Rules:</p>
                <ul className="list-inside list-disc">
                  <li>Text: 0.5" minimum from trim</li>
                  <li>Important graphics: 0.375" minimum</li>
                  <li>Decorative elements can extend to bleed</li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="image-quality">
            <AccordionTrigger className="text-sm">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Image Quality (DPI)
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                <strong>300 DPI minimum</strong> is required by Amazon KDP for professional print quality. 
                Lower resolution images will appear pixelated or blurry.
              </p>
              <div className="rounded-lg border border-border bg-secondary/30 p-2 text-xs">
                <p className="font-semibold">Recommended Sizes:</p>
                <ul className="list-inside list-disc">
                  <li>Interior pages: 2625×2625 pixels</li>
                  <li>Cover (each side): 2625×2625 pixels</li>
                  <li>Format: JPEG or PNG</li>
                  <li>Color space: RGB (converts to CMYK)</li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="spine-width">
            <AccordionTrigger className="text-sm">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Spine Width
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                Spine width is automatically calculated based on page count using Amazon KDP's standard formula. 
                Uses 0.002252" per page for white paper.
              </p>
              <div className="rounded-lg border border-border bg-secondary/30 p-2 text-xs">
                <p className="font-semibold">Spine Guidelines:</p>
                <ul className="list-inside list-disc">
                  <li>Minimum 24 pages for spine text</li>
                  <li>Keep spine text centered</li>
                  <li>Use readable font size (14pt+)</li>
                  <li>Test with proof copy</li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="file-format">
            <AccordionTrigger className="text-sm">
              <div className="flex items-center gap-2">
                <FileCheck className="h-4 w-4" />
                File Format
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                Amazon KDP accepts PDF files with specific requirements for professional printing.
              </p>
              <div className="rounded-lg border border-border bg-secondary/30 p-2 text-xs">
                <p className="font-semibold">PDF Requirements:</p>
                <ul className="list-inside list-disc">
                  <li>Embed all fonts</li>
                  <li>Flatten transparency</li>
                  <li>Include bleed in dimensions</li>
                  <li>No crop marks in file</li>
                  <li>RGB color space (converts to CMYK)</li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Separator className="my-4" />

        <div className="space-y-2">
          <Button variant="outline" size="sm" className="w-full justify-start border-2" asChild>
            <a href="https://kdp.amazon.com/en_US/help/topic/G201834180" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Amazon KDP Print Specifications
            </a>
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start border-2" asChild>
            <a href="https://kdp.amazon.com/en_US/help/topic/G201953020" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              KDP Cover Calculator
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
