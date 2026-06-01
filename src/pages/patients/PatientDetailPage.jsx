import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Edit } from 'lucide-react';
import * as patientsApi from '../../api/patientsApi';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../components/ToastContainer';
import LoadingState from '../../components/LoadingState';
import Badge from '../../components/Badge';

const PatientDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { roles } = useAuth();
  const { addToast } = useToast();

  const [patient, setPatient] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const canEdit = roles.some((role) => ['ADMIN', 'NURSE'].includes(role));

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const response = await patientsApi.getPatientById(id);
        setPatient(response.data?.data);
      } catch (error) {
        addToast('Failed to load patient', 'error');
        navigate('/patients');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatient();
  }, [id, navigate, addToast]);

  if (isLoading) {
    return <LoadingState />;
  }

  if (!patient) {
    return (
      <div className="flex min-h-[calc(100vh-96px)] items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500">Patient not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/patients')}
            className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{patient.fullName}</h1>
            <p className="mt-1 text-slate-500">Patient Details</p>
          </div>
        </div>
        {canEdit && (
          <button
            onClick={() => navigate(`/patients/${id}/edit`)}
            className="inline-flex items-center gap-2 rounded-2xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
          >
            <Edit className="h-4 w-4" />
            Edit
          </button>
        )}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-8">
        <div className="grid gap-8 sm:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-slate-500">Full Name</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{patient.fullName}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Date of Birth</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{patient.dob}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Gender</p>
            <p className="mt-1">
              <Badge variant="info">{patient.gender}</Badge>
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">CCCD</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{patient.cccd}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Phone</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{patient.phone}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Address</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{patient.address}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Blood Type</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{patient.bloodType}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Insurance Number</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {patient.insuranceNumber || '--'}
            </p>
          </div>
          {patient.createdAt && (
            <div>
              <p className="text-sm font-medium text-slate-500">Created At</p>
              <p className="mt-1 text-sm text-slate-600">{patient.createdAt}</p>
            </div>
          )}
          {patient.updatedAt && (
            <div>
              <p className="text-sm font-medium text-slate-500">Updated At</p>
              <p className="mt-1 text-sm text-slate-600">{patient.updatedAt}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientDetailPage;
