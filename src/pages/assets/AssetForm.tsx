import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import { getAssetById, addAsset, updateAsset } from '../../firebase/firestore';
import { Asset } from '../../types';
import { Card, CardHeader, CardBody, CardFooter } from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import Button from '../../components/ui/Button';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';

type FormValues = {
  name: string;
  description: string;
  category: string;
  registrationNumber: string;
};

const AssetForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormValues>();

  useEffect(() => {
    const fetchAsset = async () => {
      if (isEditMode && id) {
        try {
          const asset = await getAssetById(id);
          if (asset) {
            reset({
              name: asset.name,
              description: asset.description,
              category: asset.category,
              registrationNumber: asset.registrationNumber,
            });
          } else {
            toast.error('Asset not found');
            navigate('/assets');
          }
        } catch (error) {
          console.error('Error fetching asset:', error);
          toast.error('Failed to fetch asset details');
        } finally {
          setInitialLoading(false);
        }
      } else {
        setInitialLoading(false);
      }
    };

    fetchAsset();
  }, [id, isEditMode, navigate, reset]);

  const onSubmit = async (data: FormValues) => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      if (isEditMode && id) {
        await updateAsset(id, data);
        toast.success('Asset updated successfully');
      } else {
        await addAsset(data, currentUser.uid);
        toast.success('Asset added successfully');
      }
      navigate('/assets');
    } catch (error) {
      console.error('Error saving asset:', error);
      toast.error(isEditMode ? 'Failed to update asset' : 'Failed to add asset');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="sm"
          icon={<ArrowLeft size={16} />}
          onClick={() => navigate('/assets')}
        >
          Back
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditMode ? 'Edit Asset' : 'Add New Asset'}
        </h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardBody className="space-y-4">
            <Input
              label="Asset Name"
              id="name"
              placeholder="Enter asset name"
              error={errors.name?.message}
              {...register('name', { 
                required: 'Asset name is required',
                maxLength: { 
                  value: 100, 
                  message: 'Asset name cannot exceed 100 characters' 
                }
              })}
            />

            <Input
              label="Category"
              id="category"
              placeholder="E.g., Vehicle, Equipment, Property"
              error={errors.category?.message}
              {...register('category', { 
                required: 'Category is required',
              })}
            />

            <Input
              label="Registration/ID Number"
              id="registrationNumber"
              placeholder="Enter registration or ID number"
              error={errors.registrationNumber?.message}
              {...register('registrationNumber', { 
                required: 'Registration number is required',
              })}
            />

            <Textarea
              label="Description"
              id="description"
              placeholder="Provide details about this asset"
              rows={4}
              error={errors.description?.message}
              {...register('description', { 
                required: 'Description is required',
                maxLength: { 
                  value: 500, 
                  message: 'Description cannot exceed 500 characters' 
                }
              })}
            />
          </CardBody>
          <CardFooter className="flex justify-end space-x-4">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => navigate('/assets')}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="primary"
              icon={<Save size={18} />}
              isLoading={loading}
            >
              {isEditMode ? 'Update Asset' : 'Save Asset'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default AssetForm;