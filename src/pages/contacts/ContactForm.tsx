import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Controller, useForm } from "react-hook-form";
import { ArrowLeft, Save } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import {
  getContactById,
  addContact,
  updateContact,
  addPic,
} from "../../firebase/firestore";
import { Contact } from "../../types";
import Input from "../../components/ui/Input";
import Textarea from "../../components/ui/Textarea";
import Select from "../../components/ui/Select";
import Button from "../../components/ui/Button";
import { toast } from "react-hot-toast";

// Dummy upload function, replace with your actual upload logic
async function uploadFile(file: File): Promise<{ url: string; name: string }> {
  const pic_data = await addPic(file);
  return pic_data;
}

type IdCardInfo = {
  type: "License" | "Aadhar" | "Passport" | "Other";
  front: { url: string; name: string } | null;
  back: { url: string; name: string } | null;
};

type FormValues = {
  name: string;
  phone: string;
  address: string;
  relativeName: string;
  alternatePhone: string;
  note?: string;
  idCard1: IdCardInfo;
  idCard2: IdCardInfo;
};

const idTypeOptions = [
  { value: "Aadhar", label: "Aadhar Card" },
  { value: "License", label: "Driving License" },
  { value: "Passport", label: "Passport" },
  { value: "Other", label: "Other ID" },
];

const ContactForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
    setValue,
    watch,
  } = useForm<FormValues>({
    defaultValues: {
      idCard1: {
        type: "Aadhar",
        front: null,
        back: null,
      },
      idCard2: {
        type: "License",
        front: null,
        back: null,
      },
      note: "",
    },
  });

  const idCard1Type = watch("idCard1.type");
  const idCard2Type = watch("idCard2.type");
  const idCard1Front = watch("idCard1.front");
  const idCard1Back = watch("idCard1.back");
  const idCard2Front = watch("idCard2.front");
  const idCard2Back = watch("idCard2.back");

  useEffect(() => {
    const fetchContact = async () => {
      if (isEditMode && id) {
        try {
          const contact = await getContactById(id);
          if (contact) {
            reset({
              name: contact.name,
              phone: contact.phone,
              address: contact.address,
              relativeName: contact.relativeName,
              alternatePhone: contact.alternatePhone,
              note: contact.note || "",
              idCard1: {
                type: contact.idCard1?.type || "Aadhar",
                front: contact.idCard1?.front || null,
                back: contact.idCard1?.back || null,
              },
              idCard2: {
                type: contact.idCard2?.type || "License",
                front: contact.idCard2?.front || null,
                back: contact.idCard2?.back || null,
              },
            });
          } else {
            toast.error("Contact not found");
            navigate("/contacts");
          }
        } catch (error) {
          console.error("Error fetching contact:", error);
          toast.error("Failed to fetch contact details");
        } finally {
          setInitialLoading(false);
        }
      } else {
        setInitialLoading(false);
      }
    };

    fetchContact();
  }, [id, isEditMode, navigate, reset]);

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    cardKey: "idCard1" | "idCard2",
    side: "front" | "back"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const uploaded = await uploadFile(file);
      setValue(`${cardKey}.${side}` as any, uploaded, { shouldValidate: true });
      toast.success("File uploaded");
    } catch {
      toast.error("Failed to upload file");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: FormValues) => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const contactData = {
        ...data,
      };

      if (isEditMode && id) {
        await updateContact(id, contactData);
        toast.success("Contact updated successfully");
      } else {
        await addContact(
          contactData as unknown as Omit<Contact, "id" | "createdAt">,
          currentUser.uid
        );
        toast.success("Contact added successfully");
      }
      navigate("/contacts");
    } catch (error) {
      console.error("Error saving contact:", error);
      toast.error(
        isEditMode ? "Failed to update contact" : "Failed to add contact"
      );
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
          onClick={() => navigate("/contacts")}
        >
          Back
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditMode ? "Edit Contact" : "Add New Contact"}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Full Name"
            id="name"
            placeholder="Enter full name"
            error={errors.name?.message}
            {...register("name", {
              required: "Full name is required",
              maxLength: {
                value: 100,
                message: "Name cannot exceed 100 characters",
              },
            })}
          />

          <Input
            label="Phone Number"
            id="phone"
            placeholder="Enter phone number"
            error={errors.phone?.message}
            {...register("phone", {
              required: "Phone number is required",
              pattern: {
                value: /^[0-9]+$/,
                message: "Please enter a valid phone number",
              },
            })}
          />
        </div>

        <Textarea
          label="Address"
          id="address"
          placeholder="Enter complete address"
          rows={3}
          error={errors.address?.message}
          {...register("address", {
            required: "Address is required",
          })}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Relative/Emergency Contact Name"
            id="relativeName"
            placeholder="Enter relative name"
            error={errors.relativeName?.message}
            {...register("relativeName", {
              required: "Relative name is required",
            })}
          />

          <Input
            label="Alternate Phone Number"
            id="alternatePhone"
            placeholder="Enter alternate phone number"
            error={errors.alternatePhone?.message}
            {...register("alternatePhone", {
              required: "Alternate phone number is required",
              pattern: {
                value: /^[0-9]+$/,
                message: "Please enter a valid phone number",
              },
            })}
          />
        </div>

        <Textarea
          label="Note"
          id="note"
          placeholder="Enter any notes (optional)"
          rows={2}
          error={errors.note?.message}
          {...register("note")}
        />

        {/* ID Card 1 */}
        <div className="border rounded-lg p-4 space-y-4">
          <h2 className="font-semibold text-lg">ID Card 1</h2>
          <Controller
            name="idCard1.type"
            control={control}
            rules={{ required: "ID type is required" }}
            render={({ field }) => (
              <Select
                label="ID Type"
                id="idCard1Type"
                options={idTypeOptions}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                ref={field.ref}
              />
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                {idCard1Type} Front Picture
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, "idCard1", "front")}
                className="block w-full text-sm"
              />
              {idCard1Front && (
                <div className="mt-2 flex items-center gap-2">
                  <img
                    src={idCard1Front.url}
                    alt="Front"
                    className="h-16 rounded border"
                  />
                  <span className="text-xs">{idCard1Front.name}</span>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {idCard1Type} Back Picture
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, "idCard1", "back")}
                className="block w-full text-sm"
              />
              {idCard1Back && (
                <div className="mt-2 flex items-center gap-2">
                  <img
                    src={idCard1Back.url}
                    alt="Back"
                    className="h-16 rounded border"
                  />
                  <span className="text-xs">{idCard1Back.name}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ID Card 2 */}
        <div className="border rounded-lg p-4 space-y-4">
          <h2 className="font-semibold text-lg">ID Card 2</h2>
          <Controller
            name="idCard2.type"
            control={control}
            rules={{ required: "ID type is required" }}
            render={({ field }) => (
              <Select
                label="ID Type"
                id="idCard2Type"
                options={idTypeOptions}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                ref={field.ref}
              />
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                {idCard2Type} Front Picture
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, "idCard2", "front")}
                className="block w-full text-sm"
              />
              {idCard2Front && (
                <div className="mt-2 flex items-center gap-2">
                  <img
                    src={idCard2Front.url}
                    alt="Front"
                    className="h-16 rounded border"
                  />
                  <span className="text-xs">{idCard2Front.name}</span>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {idCard2Type} Back Picture
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, "idCard2", "back")}
                className="block w-full text-sm"
              />
              {idCard2Back && (
                <div className="mt-2 flex items-center gap-2">
                  <img
                    src={idCard2Back.url}
                    alt="Back"
                    className="h-16 rounded border"
                  />
                  <span className="text-xs">{idCard2Back.name}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/contacts")}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            icon={<Save size={18} />}
            isLoading={loading}
          >
            {isEditMode ? "Update Contact" : "Save Contact"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ContactForm;
