import React from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Plus, Calendar, DollarSign } from 'lucide-react';
import lokahPoster from 'figma:asset/14c5dd73ef53996272c4f5e3d9298de97d17ae6c.png';
import thudarumPoster from 'figma:asset/d7f51f40d12a00f09ba011b7f7de2f339b6d4bc1.png';
import diesIraePoster from 'figma:asset/8e84d33a287e36bd733fd1196f7b5380aa26d601.png';

interface Project {
  id: string;
  title: string;
  dateRange: string;
  totalBudget: number;
  spent: number;
  poster: string;
}

interface ProjectSelectionProps {
  onSelectProject: (projectId: string) => void;
}

export function ProjectSelection({ onSelectProject }: ProjectSelectionProps) {
  const projects: Project[] = [
    {
      id: '1',
      title: 'Lokah',
      dateRange: 'Jan 2025 - Mar 2025',
      totalBudget: 5000000,
      spent: 2340000,
      poster: lokahPoster
    },
    {
      id: '2',
      title: 'Thudarum',
      dateRange: 'Nov 2024 - Jan 2025',
      totalBudget: 8000000,
      spent: 7200000,
      poster: thudarumPoster
    },
    {
      id: '3',
      title: 'Diés Iraé',
      dateRange: 'Mar 2025 - Jun 2025',
      totalBudget: 12000000,
      spent: 850000,
      poster: diesIraePoster
    }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl lg:text-4xl mb-2">Select a Project</h1>
          <p className="text-gray-600">Choose a project to manage its budget and expenses</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {projects.map((project) => {
            const percentSpent = (project.spent / project.totalBudget) * 100;
            
            return (
              <Card 
                key={project.id}
                className="overflow-hidden cursor-pointer hover:shadow-xl transition-shadow"
                onClick={() => onSelectProject(project.id)}
              >
                <div className="aspect-[2/3] relative overflow-hidden bg-gray-200">
                  <ImageWithFallback
                    src={project.poster}
                    alt={project.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <h3 className="text-2xl mb-1">{project.title}</h3>
                    <div className="flex items-center gap-2 text-sm opacity-90">
                      <Calendar className="w-4 h-4" />
                      <span>{project.dateRange}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Budget</span>
                    <span className="text-[#1E3A8A]">{formatCurrency(project.totalBudget)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Spent</span>
                    <span className="text-gray-900">{formatCurrency(project.spent)}</span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Progress</span>
                      <span className={percentSpent > 90 ? 'text-red-600' : 'text-green-600'}>
                        {percentSpent.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${percentSpent > 90 ? 'bg-red-500' : 'bg-green-500'}`}
                        style={{ width: `${Math.min(percentSpent, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <Button
          className="fixed bottom-8 right-8 h-14 w-14 rounded-full shadow-lg bg-[#FACC15] hover:bg-[#FACC15]/90 text-gray-900"
          size="icon"
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
}
