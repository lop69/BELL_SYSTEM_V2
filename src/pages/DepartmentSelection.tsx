import { useNavigate } from 'react-router-dom';
import { Building, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const departments = [
  { name: 'Main Campus', location: '123 University Ave' },
  { name: 'Engineering Block', location: '456 Tech Road' },
  { name: 'Arts & Sciences', location: '789 College St' },
  { name: 'Medical Facility', location: '101 Health Blvd' },
];

const DepartmentSelection = () => {
  const navigate = useNavigate();

  const handleSelect = () => {
    // In a real app, you'd store the selection
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background p-4 flex flex-col items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Select Department</CardTitle>
          <CardDescription>Choose your operational department to continue.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-2">
            {departments.map((dept) => (
              <li
                key={dept.name}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                onClick={handleSelect}
              >
                <div className="flex items-center space-x-4">
                  <div className="bg-secondary p-3 rounded-lg">
                    <Building className="h-6 w-6 text-secondary-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold">{dept.name}</p>
                    <p className="text-sm text-muted-foreground">{dept.location}</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default DepartmentSelection;