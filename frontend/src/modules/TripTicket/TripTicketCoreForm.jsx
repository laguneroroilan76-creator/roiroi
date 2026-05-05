import React from 'react';
import { 
  FormHeader, 
  GeneralInfo, 
  TravelDetails, 
  FleetAssignment, 
  LogisticsSection, 
  GuardLogSection, 
  SignatureSection 
} from './TripTicketFormSections';

export default function TripTicketCoreForm({ 
  formData, 
  status,
  handleChange, 
  isFieldDisabled, 
  isReadOnly, 
  drivers, 
  vehicles, 
  occupiedDrivers, 
  occupiedVehicles, 
  guards, 
  user 
}) {
  return (
    <div className="form-container glass">
      <FormHeader status={status || formData?.status} formData={formData} />
      <div className="form-body">
        <GeneralInfo 
          formData={formData} 
          handleChange={handleChange} 
          isFieldDisabled={isFieldDisabled} 
          isReadOnly={isReadOnly} 
        />
        <TravelDetails 
          formData={formData} 
          handleChange={handleChange} 
          isFieldDisabled={isFieldDisabled} 
          isReadOnly={isReadOnly} 
        />
        <FleetAssignment 
          formData={formData} 
          handleChange={handleChange} 
          isFieldDisabled={isFieldDisabled} 
          isReadOnly={isReadOnly} 
          drivers={drivers} 
          vehicles={vehicles} 
          occupiedDrivers={occupiedDrivers} 
          occupiedVehicles={occupiedVehicles} 
        />
        <LogisticsSection 
          formData={formData} 
          handleChange={handleChange} 
          isFieldDisabled={isFieldDisabled} 
          isReadOnly={isReadOnly} 
        />
        <GuardLogSection 
          formData={formData} 
          handleChange={handleChange} 
          isFieldDisabled={isFieldDisabled} 
          isReadOnly={isReadOnly} 
          guards={guards} 
        />
        <SignatureSection 
          formData={formData} 
          handleChange={handleChange} 
          isFieldDisabled={isFieldDisabled} 
          isReadOnly={isReadOnly} 
          user={user} 
        />
      </div>
    </div>
  );
}
