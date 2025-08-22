import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { ArrowLeft, Save } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import {
  getRentalById,
  addRental,
  updateRental,
  getAssets,
  getContacts,
} from "../../firebase/firestore";
import { Asset, Contact, BadgeColor, Rental, RateType } from "../../types";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
} from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import { toast } from "react-hot-toast";
import { addDays, format } from "date-fns";

type FormValues = {
  assetId: string;
  contactId: string;
  rate: number;
  rateType: RateType;
  startDate: string;
  badgeColor: BadgeColor;
  badgeCharacter: string;
  status: "active" | "ended";
};

const RentalForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<FormValues>({
    defaultValues: {
      rateType: "monthly",
      status: "active",
      badgeColor: "blue",
      badgeCharacter: "R",
      startDate: format(new Date(), "yyyy-MM-dd"),
    },
  });

  const badgeColor = watch("badgeColor");
  const badgeCharacter = watch("badgeCharacter");

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;

      try {
        // Fetch assets and contacts
        const [fetchedAssets, fetchedContacts] = await Promise.all([
          getAssets(currentUser.uid),
          getContacts(currentUser.uid),
        ]);

        setAssets(fetchedAssets);
        setContacts(fetchedContacts);

        // If editing, fetch rental details
        if (isEditMode && id) {
          const rental = await getRentalById(id);
          if (rental) {
            reset({
              assetId: rental.assetId,
              contactId: rental.contactId,
              rate: rental.rate,
              rateType: rental.rateType,
              startDate: format(rental.startDate, "yyyy-MM-dd"),
              badgeColor: rental.badgeColor,
              badgeCharacter: rental.badgeCharacter,
              status: rental.status,
            });
          } else {
            toast.error("Rental not found");
            navigate("/rentals");
          }
        } else if (fetchedAssets.length > 0) {
          setValue("assetId", fetchedAssets[0].id);
        }

        if (fetchedContacts.length > 0) {
          setValue("contactId", fetchedContacts[0].id);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load required data");
      } finally {
        setInitialLoading(false);
      }
    };

    fetchData();
  }, [currentUser, id, isEditMode, navigate, reset, setValue]);

  const onSubmit = async (data: FormValues) => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const startDate = new Date(data.startDate);

      let rentalData;
      if (isEditMode) {
        rentalData = {
          ...data,
          rate: Number(data.rate),
          startDate,
        };
      } else {
        // Calculate next payment date (1 month from start date for monthly, 1 day for daily)
        const nextPaymentDate =
          data.rateType === "monthly"
            ? addDays(startDate, 30)
            : addDays(startDate, 1);

        rentalData = {
          ...data,
          rate: Number(data.rate),
          startDate,
          nextPaymentDate,
        };
      }

      if (isEditMode && id) {
        await updateRental(id, rentalData);
        toast.success("Rental updated successfully");
      } else {
        await addRental(
          rentalData as Omit<Rental, "id" | "createdAt">,
          currentUser.uid
        );
        toast.success("Rental added successfully");
      }
      navigate("/rentals");
    } catch (error) {
      console.error("Error saving rental:", error);
      toast.error(
        isEditMode ? "Failed to update rental" : "Failed to add rental"
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

  const badgeColors: Array<{ value: BadgeColor; label: string }> = [
    { value: "blue", label: "Blue" },
    { value: "green", label: "Green" },
    { value: "red", label: "Red" },
    { value: "yellow", label: "Yellow" },
    { value: "purple", label: "Purple" },
    { value: "orange", label: "Orange" },
    { value: "teal", label: "Teal" },
    { value: "pink", label: "Pink" },
    { value: "black", label: "Black" },
    { value: "grey", label: "Grey" },
    { value: "maroon", label: "Maroon" },
    { value: "lightyellow", label: "Light Yellow" },
    { value: "darkgreen", label: "Dark Green" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          icon={<ArrowLeft size={16} />}
          onClick={() => navigate("/rentals")}
        >
          Back
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditMode ? "Edit Rental" : "Add New Rental"}
        </h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardBody className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h2 className="text-lg font-medium text-gray-900">
                  Rental Information
                </h2>

                <Select
                  label="Asset"
                  id="assetId"
                  options={assets.map((asset) => ({
                    value: asset.id,
                    label: asset.name,
                  }))}
                  error={errors.assetId?.message}
                  {...register("assetId", {
                    required: "Asset is required",
                  })}
                  onChange={(value) => setValue("assetId", value)}
                />

                <Select
                  label="Contact"
                  id="contactId"
                  options={contacts.map((contact) => ({
                    value: contact.id,
                    label: contact.name,
                  }))}
                  error={errors.contactId?.message}
                  {...register("contactId", {
                    required: "Contact is required",
                  })}
                  onChange={(value) => setValue("contactId", value)}
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Rate Amount (₹)"
                    id="rate"
                    type="number"
                    min="0"
                    placeholder="Enter rate amount"
                    error={errors.rate?.message}
                    {...register("rate", {
                      required: "Rate is required",
                      min: { value: 0, message: "Rate must be positive" },
                      valueAsNumber: true,
                    })}
                  />

                  <Select
                    label="Rate Type"
                    id="rateType"
                    options={[
                      { value: "daily", label: "Daily" },
                      { value: "monthly", label: "Monthly" },
                    ]}
                    error={errors.rateType?.message}
                    {...register("rateType", {
                      required: "Rate type is required",
                    })}
                    onChange={(value) =>
                      setValue("rateType", value as RateType)
                    }
                  />
                </div>

                <Input
                  label="Start Date"
                  id="startDate"
                  type="date"
                  error={errors.startDate?.message}
                  {...register("startDate", {
                    required: "Start date is required",
                  })}
                />

                <Select
                  label="Status"
                  id="status"
                  options={[
                    { value: "active", label: "Active" },
                    { value: "ended", label: "Ended" },
                  ]}
                  error={errors.status?.message}
                  {...register("status", {
                    required: "Status is required",
                  })}
                  onChange={(value) =>
                    setValue("status", value as "active" | "ended")
                  }
                />
              </div>

              <div className="space-y-4">
                <h2 className="text-lg font-medium text-gray-900">
                  Appearance
                </h2>

                <div className="flex items-center mb-6">
                  <div className="mr-6">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Badge Preview
                    </p>
                    <Badge
                      color={badgeColor as BadgeColor}
                      character={badgeCharacter || "R"}
                      size="lg"
                    />
                  </div>

                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                      label="Badge Color"
                      id="badgeColor"
                      options={badgeColors}
                      error={errors.badgeColor?.message}
                      {...register("badgeColor", {
                        required: "Badge color is required",
                      })}
                      onChange={(value) =>
                        setValue("badgeColor", value as BadgeColor)
                      }
                    />

                    <Input
                      label="Badge Character"
                      id="badgeCharacter"
                      maxLength={1}
                      placeholder="Single letter"
                      error={errors.badgeCharacter?.message}
                      {...register("badgeCharacter", {
                        required: "Badge character is required",
                        maxLength: {
                          value: 1,
                          message: "Only one character allowed",
                        },
                      })}
                    />
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-md">
                  <h3 className="text-md font-medium text-blue-800 mb-2">
                    Important Information
                  </h3>
                  <ul className="space-y-2 text-sm text-blue-700">
                    <li>
                      • After creating a rental, you can add payments and
                      expenses.
                    </li>
                    <li>
                      • The next payment date will be calculated based on the
                      start date and rate type.
                    </li>
                    <li>
                      • The badge helps you quickly identify this rental in
                      lists and reports.
                    </li>
                    <li>
                      • You can generate a statement from the rental details
                      page after creation.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </CardBody>
          <CardFooter className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/rentals")}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              icon={<Save size={18} />}
              isLoading={loading}
            >
              {isEditMode ? "Update Rental" : "Save Rental"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default RentalForm;
