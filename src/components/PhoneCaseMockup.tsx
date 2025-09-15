import React from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface PhoneCaseMockupProps {
  phoneModel: string;
  designImage?: string | null;
  className?: string;
}

// Phone case mockup configurations
const PHONE_MOCKUPS = {
  'iphone-15-pro': {
    name: 'iPhone 15 Pro',
    mockupUrl: 'https://images.unsplash.com/photo-1706972612625-d5be9a7aadd8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpcGhvbmUlMjBjYXNlJTIwbW9ja3VwfGVufDF8fHx8MTc1Nzc5MDk4Mnww&ixlib=rb-4.1.0&q=80&w=1080',
    designArea: { top: '12%', left: '15%', width: '70%', height: '76%' }
  },
  'iphone-15': {
    name: 'iPhone 15',
    mockupUrl: 'https://images.unsplash.com/photo-1706972612625-d5be9a7aadd8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpcGhvbmUlMjBjYXNlJTIwbW9ja3VwfGVufDF8fHx8MTc1Nzc5MDk4Mnww&ixlib=rb-4.1.0&q=80&w=1080',
    designArea: { top: '12%', left: '15%', width: '70%', height: '76%' }
  },
  'iphone-14-pro': {
    name: 'iPhone 14 Pro',
    mockupUrl: 'https://images.unsplash.com/photo-1706972612625-d5be9a7aadd8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpcGhvbmUlMjBjYXNlJTIwbW9ja3VwfGVufDF8fHx8MTc1Nzc5MDk4Mnww&ixlib=rb-4.1.0&q=80&w=1080',
    designArea: { top: '12%', left: '15%', width: '70%', height: '76%' }
  },
  'iphone-14': {
    name: 'iPhone 14',
    mockupUrl: 'https://images.unsplash.com/photo-1706972612625-d5be9a7aadd8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpcGhvbmUlMjBjYXNlJTIwbW9ja3VwfGVufDF8fHx8MTc1Nzc5MDk4Mnww&ixlib=rb-4.1.0&q=80&w=1080',
    designArea: { top: '12%', left: '15%', width: '70%', height: '76%' }
  },
  'samsung-s24': {
    name: 'Samsung Galaxy S24',
    mockupUrl: 'https://images.unsplash.com/photo-1525446517618-9a9e5430288b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzYW1zdW5nJTIwcGhvbmUlMjBjYXNlJTIwbW9ja3VwfGVufDF8fHx8MTc1Nzc5MDk4Nnww&ixlib=rb-4.1.0&q=80&w=1080',
    designArea: { top: '10%', left: '12%', width: '76%', height: '80%' }
  },
  'samsung-s23': {
    name: 'Samsung Galaxy S23',
    mockupUrl: 'https://images.unsplash.com/photo-1525446517618-9a9e5430288b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzYW1zdW5nJTIwcGhvbmUlMjBjYXNlJTIwbW9ja3VwfGVufDF8fHx8MTc1Nzc5MDk4Nnww&ixlib=rb-4.1.0&q=80&w=1080',
    designArea: { top: '10%', left: '12%', width: '76%', height: '80%' }
  },
  'pixel-8-pro': {
    name: 'Google Pixel 8 Pro',
    mockupUrl: 'https://images.unsplash.com/photo-1742827621323-862bcad4ff30?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaG9uZSUyMGNhc2UlMjBtb2NrdXAlMjB0cmFuc3BhcmVudHxlbnwxfHx8fDE3NTc3OTA5Nzh8MA&ixlib=rb-4.1.0&q=80&w=1080',
    designArea: { top: '8%', left: '10%', width: '80%', height: '84%' }
  },
  'pixel-8': {
    name: 'Google Pixel 8',
    mockupUrl: 'https://images.unsplash.com/photo-1742827621323-862bcad4ff30?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaG9uZSUyMGNhc2UlMjBtb2NrdXAlMjB0cmFuc3BhcmVudHxlbnwxfHx8fDE3NTc3OTA5Nzh8MA&ixlib=rb-4.1.0&q=80&w=1080',
    designArea: { top: '8%', left: '10%', width: '80%', height: '84%' }
  }
};

export function PhoneCaseMockup({ phoneModel, designImage, className = '' }: PhoneCaseMockupProps) {
  const mockup = PHONE_MOCKUPS[phoneModel as keyof typeof PHONE_MOCKUPS];
  
  if (!mockup) {
    return (
      <div className={`bg-muted rounded-lg flex items-center justify-center ${className}`}>
        <p className="text-muted-foreground text-center p-4">
          Phone model not available for preview
        </p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Phone case mockup background */}
      <div className="relative w-full h-full">
        <ImageWithFallback
          src={mockup.mockupUrl}
          alt={`${mockup.name} case mockup`}
          className="w-full h-full object-contain"
        />
        
        {/* Design overlay */}
        {designImage && (
          <div 
            className="absolute rounded-lg overflow-hidden"
            style={{
              top: mockup.designArea.top,
              left: mockup.designArea.left,
              width: mockup.designArea.width,
              height: mockup.designArea.height,
            }}
          >
            <ImageWithFallback
              src={designImage}
              alt="Custom design"
              className="w-full h-full object-cover"
            />
            {/* Subtle overlay to simulate case material */}
            <div className="absolute inset-0 bg-black/5 mix-blend-multiply" />
          </div>
        )}
        
        {/* Placeholder when no design */}
        {!designImage && (
          <div 
            className="absolute flex items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30"
            style={{
              top: mockup.designArea.top,
              left: mockup.designArea.left,
              width: mockup.designArea.width,
              height: mockup.designArea.height,
            }}
          >
            <div className="text-center text-muted-foreground p-2">
              <svg
                className="w-8 h-8 mx-auto mb-2 opacity-50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-xs">Your Design</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}