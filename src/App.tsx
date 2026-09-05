import { useState, useEffect } from 'react';
import {
  UserProfile,
  EngagementRecord,
  NewEngagementDraft,
  FlowStep,
  ScoreLevel,
  ReportRecord,
  AdminUserRecord,
} from './types';
import { INITIAL_ENGAGEMENTS, INITIAL_USER, SCORE_OPTIONS } from './data/constants';
import { BottomNavBar, Header } from './components/Navigation';
import { AuthModal } from './components/AuthModal';
import { SplashScreen } from './components/Screens/SplashScreen';
import { RegisterScreen } from './components/Screens/RegisterScreen';
import { HomeScreen } from './components/Screens/HomeScreen';
import { ScoreScreen } from './components/Screens/ScoreScreen';
import { FeelingScreen } from './components/Screens/FeelingScreen';
import { LocationScreen } from './components/Screens/LocationScreen';
import { AttireScreen } from './components/Screens/AttireScreen';
import { EyesScreen } from './components/Screens/EyesScreen';
import { BuildScreen } from './components/Screens/BuildScreen';
import { HairScreen } from './components/Screens/HairScreen';
import { CommentsScreen } from './components/Screens/CommentsScreen';
import { ReviewScreen } from './components/Screens/ReviewScreen';
import { ConfirmationScreen } from './components/Screens/ConfirmationScreen';
import { CreateReportScreen } from './components/Screens/CreateReportScreen';
import { ReportSummaryScreen } from './components/Screens/ReportSummaryScreen';
import { EngagementsListScreen } from './components/Screens/EngagementsListScreen';
import { EngagementDetailScreen } from './components/Screens/EngagementDetailScreen';
import { ReportsDashboard } from './components/Screens/ReportsDashboard';
import { SettingsScreen } from './components/Screens/SettingsScreen';
import { TriggersScreen } from './components/Screens/TriggersScreen';
import { AdminScreen } from './components/Screens/AdminScreen';

const EMPTY_DRAFT: NewEngagementDraft = {
  score: null,
  feelings: [],
  feelingsOther: '',
  locations: [],
  locationsOther: '',
  attire: [],
  attireOther: '',
  eyesWentTo: [],
  eyesOther: '',
  herBuild: [],
  herBuildOther: '',
  hairColor: '',
  hairColorOther: '',
  comments: '',
  triggers: [],
};

export default function App() {
  // Load user profile from localStorage or initialize defaults
  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('lookaway_user');
      return saved ? JSON.parse(saved) : INITIAL_USER;
    } catch {
      return INITIAL_USER;
    }
  });

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return localStorage.getItem('lookaway_authenticated') === 'true';
    } catch {
      return false;
    }
  });

  // Auth modal popup opens automatically on startup with app logo, Get Started, and under it Log In & Sign Up
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(true);
  const [authModalInitialView, setAuthModalInitialView] = useState<'welcome' | 'login' | 'signup'>('welcome');

  const [engagements, setEngagements] = useState<EngagementRecord[]>(() => {
    try {
      const saved = localStorage.getItem('lookaway_engagements');
      return saved ? JSON.parse(saved) : INITIAL_ENGAGEMENTS;
    } catch {
      return INITIAL_ENGAGEMENTS;
    }
  });

  const [currentStep, setCurrentStep] = useState<FlowStep>('home');
  const [draft, setDraft] = useState<NewEngagementDraft>(EMPTY_DRAFT);
  const [lastLoggedEngagement, setLastLoggedEngagement] = useState<EngagementRecord | null>(
    engagements[0] || null
  );
  const [selectedEngagement, setSelectedEngagement] = useState<EngagementRecord>(
    engagements[0] || INITIAL_ENGAGEMENTS[0]
  );

  const [startDate, setStartDate] = useState<string>('2025-04-24');
  const [endDate, setEndDate] = useState<string>('2025-05-24');
  const [lastReport, setLastReport] = useState<ReportRecord | null>(() => {
    try {
      const saved = localStorage.getItem('lookaway_last_report');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [reports, setReports] = useState<ReportRecord[]>(() => {
    try {
      const saved = localStorage.getItem('lookaway_reports');
      if (saved) return JSON.parse(saved);
      const last = localStorage.getItem('lookaway_last_report');
      return last ? [JSON.parse(last)] : [];
    } catch {
      return [];
    }
  });
  const [adminUsers, setAdminUsers] = useState<AdminUserRecord[]>(() => {
    try {
      const saved = localStorage.getItem('lookaway_admin_users');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Persistence
  useEffect(() => {
    try {
      localStorage.setItem('lookaway_user', JSON.stringify(user));
    } catch (e) {
      console.error(e);
    }
  }, [user]);

  useEffect(() => {
    try {
      localStorage.setItem('lookaway_engagements', JSON.stringify(engagements));
    } catch (e) {
      console.error(e);
    }
  }, [engagements]);

  useEffect(() => {
    if (lastReport) localStorage.setItem('lookaway_last_report', JSON.stringify(lastReport));
  }, [lastReport]);

  useEffect(() => {
    localStorage.setItem('lookaway_reports', JSON.stringify(reports));
  }, [reports]);

  useEffect(() => {
    setAdminUsers((previous) => {
      const nextRecord: AdminUserRecord = { ...user, engagements, reports };
      const next = previous.some((record) => record.email === user.email)
        ? previous.map((record) => (record.email === user.email ? nextRecord : record))
        : [...previous, nextRecord];
      localStorage.setItem('lookaway_admin_users', JSON.stringify(next));
      return next;
    });
  }, [user, engagements, reports]);

  // Auth Handlers
  const handleLogin = (profile: UserProfile) => {
    setUser(profile);
    setIsAuthenticated(true);
    try {
      localStorage.setItem('lookaway_authenticated', 'true');
    } catch (e) {
      console.error(e);
    }
    setIsAuthModalOpen(false);
    if (currentStep === 'register' || currentStep === 'splash') {
      setCurrentStep('home');
    }
  };

  const handleSignUp = (profile: UserProfile) => {
    setUser(profile);
    setIsAuthenticated(true);
    try {
      localStorage.setItem('lookaway_authenticated', 'true');
    } catch (e) {
      console.error(e);
    }
    setIsAuthModalOpen(false);
    if (currentStep === 'register' || currentStep === 'splash') {
      setCurrentStep('home');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    try {
      localStorage.removeItem('lookaway_authenticated');
    } catch (e) {
      console.error(e);
    }
    setIsAuthModalOpen(true);
  };

  // Handlers for logging flow
  const handleStartLogging = () => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    setDraft(EMPTY_DRAFT);
    setCurrentStep('score');
  };

  const handleSelectScore = (score: ScoreLevel) => {
    setDraft((prev) => ({ ...prev, score }));
  };

  const handleToggleFeeling = (feeling: string) => {
    setDraft((prev) => {
      const exists = prev.feelings.includes(feeling);
      return {
        ...prev,
        feelings: exists
          ? prev.feelings.filter((f) => f !== feeling)
          : [...prev.feelings, feeling],
      };
    });
  };

  const handleToggleLocation = (loc: string) => {
    setDraft((prev) => {
      const exists = prev.locations.includes(loc);
      return {
        ...prev,
        locations: exists
          ? prev.locations.filter((l) => l !== loc)
          : [...prev.locations, loc],
      };
    });
  };

  const handleToggleAttire = (attire: string) => {
    setDraft((prev) => {
      const exists = prev.attire.includes(attire);
      return {
        ...prev,
        attire: exists
          ? prev.attire.filter((a) => a !== attire)
          : [...prev.attire, attire],
      };
    });
  };

  const handleToggleEyes = (eyeTarget: string) => {
    setDraft((prev) => {
      const exists = prev.eyesWentTo.includes(eyeTarget);
      return {
        ...prev,
        eyesWentTo: exists
          ? prev.eyesWentTo.filter((e) => e !== eyeTarget)
          : [...prev.eyesWentTo, eyeTarget],
      };
    });
  };

  const handleToggleBuild = (build: string) => {
    setDraft((prev) => {
      const exists = prev.herBuild.includes(build);
      return {
        ...prev,
        herBuild: exists
          ? prev.herBuild.filter((b) => b !== build)
          : [...prev.herBuild, build],
      };
    });
  };

  const handleSelectHair = (color: string) => {
    setDraft((prev) => ({ ...prev, hairColor: color }));
  };

  const handleSubmitEngagement = () => {
    const now = new Date();
    const scoreObj = SCORE_OPTIONS.find((s) => s.level === (draft.score || 2));
    const scoreLabel = scoreObj ? scoreObj.title : '2 – LOOK';

    // Format fields with other text
    const formatItems = (items: string[], other: string) => {
      const res = [...items];
      if (res.includes('OTHER') && other.trim()) {
        const idx = res.indexOf('OTHER');
        res[idx] = other.trim();
      }
      return res.length > 0 ? res : ['General'];
    };

    const finalFeelings = formatItems(draft.feelings, draft.feelingsOther);
    const finalLocations = formatItems(draft.locations, draft.locationsOther);
    const finalAttire = formatItems(draft.attire, draft.attireOther);
    const finalEyes = formatItems(draft.eyesWentTo, draft.eyesOther);
    const finalBuild = formatItems(draft.herBuild, draft.herBuildOther);
    const finalHair =
      draft.hairColor === 'OTHER' && draft.hairColorOther.trim()
        ? draft.hairColorOther.trim()
        : draft.hairColor || 'Brown / Auburn';

    const newRecord: EngagementRecord = {
      id: `eng-${Date.now()}`,
      timestamp: now.toISOString(),
      dateStr: now.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      timeStr: now.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      }),
      score: (draft.score as ScoreLevel) || 2,
      scoreLabel,
      feelings: finalFeelings,
      locations: finalLocations,
      attire: finalAttire,
      eyesWentTo: finalEyes,
      herBuild: finalBuild,
      hairColor: finalHair,
      comments: draft.comments.trim() || 'Visual engagement logged.',
      triggers: draft.triggers,
    };

    setEngagements((prev) => [newRecord, ...prev]);
    setLastLoggedEngagement(newRecord);
    setSelectedEngagement(newRecord);
    setCurrentStep('confirmation');
  };

  const handleDeleteEngagement = (id: string) => {
    if (window.confirm('Delete this engagement log?')) {
      setEngagements((prev) => prev.filter((e) => e.id !== id));
    }
  };

  const handleResetSampleData = () => {
    if (window.confirm('Reset data to the reference sample engagements?')) {
      setEngagements(INITIAL_ENGAGEMENTS);
      setUser(INITIAL_USER);
      alert('Sample data reset successfully!');
    }
  };

  const handleClearAllData = () => {
    if (window.confirm('Are you sure you want to delete ALL engagement logs?')) {
      setEngagements([]);
      alert('All engagement logs cleared.');
    }
  };

  const handleImportData = (newEngagements: EngagementRecord[]) => {
    setEngagements(newEngagements);
  };

  // Render specific active step screen
  const renderScreen = () => {
    switch (currentStep) {
      case 'splash':
        return (
          <SplashScreen
            onGetStarted={() => setCurrentStep('register')}
            onLogIn={() => {
              setAuthModalInitialView('login');
              setIsAuthModalOpen(true);
            }}
            onSignUp={() => setCurrentStep('register')}
          />
        );

      case 'register':
        return (
          <RegisterScreen
            user={user}
            onSaveProfile={(p) => setUser(p)}
            onContinue={() => setCurrentStep('home')}
          />
        );

      case 'home':
        return (
          <HomeScreen
            user={user}
            engagements={engagements}
            onStartLogging={handleStartLogging}
            onCreateReport={() => setCurrentStep('create_report')}
            onViewReports={() => setCurrentStep('report_summary')}
            onOpenMenu={() => {
              setAuthModalInitialView('welcome');
              setIsAuthModalOpen(true);
            }}
          />
        );

      case 'score':
        return (
          <ScoreScreen
            selectedScore={draft.score}
            onSelectScore={handleSelectScore}
            onNext={() => setCurrentStep('feeling')}
            onBack={() => setCurrentStep('home')}
          />
        );

      case 'feeling':
        return (
          <FeelingScreen
            selectedFeelings={draft.feelings}
            otherText={draft.feelingsOther}
            onToggleFeeling={handleToggleFeeling}
            onChangeOther={(t) => setDraft((p) => ({ ...p, feelingsOther: t }))}
            onNext={() => setCurrentStep('location')}
            onBack={() => setCurrentStep('score')}
          />
        );

      case 'location':
        return (
          <LocationScreen
            selectedLocations={draft.locations}
            otherText={draft.locationsOther}
            onToggleLocation={handleToggleLocation}
            onChangeOther={(t) => setDraft((p) => ({ ...p, locationsOther: t }))}
            onNext={() => setCurrentStep('attire')}
            onBack={() => setCurrentStep('feeling')}
          />
        );

      case 'attire':
        return (
          <AttireScreen
            selectedAttire={draft.attire}
            otherText={draft.attireOther}
            onToggleAttire={handleToggleAttire}
            onChangeOther={(t) => setDraft((p) => ({ ...p, attireOther: t }))}
            onNext={() => setCurrentStep('eyes')}
            onBack={() => setCurrentStep('location')}
          />
        );

      case 'eyes':
        return (
          <EyesScreen
            selectedEyes={draft.eyesWentTo}
            otherText={draft.eyesOther}
            onToggleEyes={handleToggleEyes}
            onChangeOther={(t) => setDraft((p) => ({ ...p, eyesOther: t }))}
            onNext={() => setCurrentStep('build')}
            onBack={() => setCurrentStep('attire')}
          />
        );

      case 'build':
        return (
          <BuildScreen
            selectedBuilds={draft.herBuild}
            otherText={draft.herBuildOther}
            onToggleBuild={handleToggleBuild}
            onChangeOther={(t) => setDraft((p) => ({ ...p, herBuildOther: t }))}
            onNext={() => setCurrentStep('hair')}
            onBack={() => setCurrentStep('eyes')}
          />
        );

      case 'hair':
        return (
          <HairScreen
            selectedHair={draft.hairColor}
            otherText={draft.hairColorOther}
            onSelectHair={handleSelectHair}
            onChangeOther={(t) => setDraft((p) => ({ ...p, hairColorOther: t }))}
            onNext={() => setCurrentStep('comments')}
            onBack={() => setCurrentStep('build')}
          />
        );

      case 'comments':
        return (
          <CommentsScreen
            comments={draft.comments}
            onChangeComments={(t) => setDraft((p) => ({ ...p, comments: t }))}
            onNext={() => setCurrentStep('review')}
            onBack={() => setCurrentStep('hair')}
          />
        );

      case 'triggers':
        return (
          <TriggersScreen
            selectedTriggers={draft.triggers}
            onToggleTrigger={(trigger) =>
              setDraft((prev) => ({
                ...prev,
                triggers: prev.triggers.some((entry) => entry.trigger === trigger)
                  ? prev.triggers.filter((entry) => entry.trigger !== trigger)
                  : [...prev.triggers, { trigger, comment: '' }],
              }))
            }
            onChangeComment={(trigger, comment) =>
              setDraft((prev) => ({
                ...prev,
                triggers: prev.triggers.map((entry) =>
                  entry.trigger === trigger ? { ...entry, comment } : entry
                ),
              }))
            }
            onNext={() => setCurrentStep('review')}
            onBack={() => setCurrentStep('comments')}
          />
        );

      case 'review':
        return (
          <ReviewScreen
            draft={draft}
            onEdit={(stepName) => setCurrentStep((stepName as FlowStep) || 'score')}
            onSubmit={handleSubmitEngagement}
          />
        );

      case 'confirmation':
        return (
          <ConfirmationScreen
            lastEngagement={lastLoggedEngagement}
            onHome={() => setCurrentStep('home')}
            onViewReports={() => setCurrentStep('report_summary')}
            onLogAnother={handleStartLogging}
          />
        );

      case 'create_report':
        return (
          <CreateReportScreen
            user={user}
            startDate={startDate}
            endDate={endDate}
            onUpdateDates={(s, e) => {
              setStartDate(s);
              setEndDate(e);
            }}
            onGenerateReport={(emailToSend, secondaryEmailToSend, phoneToSend, generalComments, reportTriggers) => {
              const report: ReportRecord = {
                id: `report-${Date.now()}`,
                createdAt: new Date().toISOString(),
                startDate,
                endDate,
                emailToSend: emailToSend.trim(),
                secondaryEmailToSend: secondaryEmailToSend.trim(),
                phoneToSend,
                generalComments: generalComments.trim(),
                triggers: reportTriggers.length
                  ? reportTriggers
                  : engagements.flatMap((engagement) => engagement.triggers || []),
              };
              setUser((currentUser) => ({
                ...currentUser,
                accountabilityEmail: emailToSend.trim(),
              }));
              setLastReport(report);
              setReports((previous) => [report, ...previous]);
              void fetch('/api/send-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  recipients: [report.emailToSend, report.secondaryEmailToSend].filter(Boolean),
                  report,
                  user,
                }),
              })
                .then(async (response) => {
                  if (response.ok) return;

                  let message = 'The report email could not be sent.';
                  try {
                    const body = await response.json();
                    if (body.error) message = body.error;
                  } catch {
                    // Keep the fallback message when the function returns a non-JSON response.
                  }
                  throw new Error(message);
                })
                .catch((error) => {
                  console.error('Report email delivery failed:', error);
                  window.alert(`Report email was not sent: ${error.message}`);
                });
              setCurrentStep('report_summary');
            }}
            onBack={() => setCurrentStep('home')}
          />
        );

      case 'report_summary':
        return (
          <ReportSummaryScreen
            user={user}
            engagements={engagements}
            onCreateReport={() => setCurrentStep('create_report')}
            startDate={lastReport?.startDate || startDate}
            endDate={lastReport?.endDate || endDate}
            reports={reports}
            generalComments={lastReport?.generalComments || ''}
            triggerEntries={lastReport?.triggers || []}
            onBack={() => setCurrentStep('create_report')}
            onViewEngagements={() => setCurrentStep('engagements_list')}
          />
        );

      case 'engagements_list':
        return (
          <EngagementsListScreen
            engagements={engagements}
            onBack={() => setCurrentStep('report_summary')}
            onSelectEngagement={(item) => {
              setSelectedEngagement(item);
              setCurrentStep('engagement_detail');
            }}
          />
        );

      case 'engagement_detail':
        return (
          <EngagementDetailScreen
            engagement={selectedEngagement || engagements[0]}
            onBack={() => setCurrentStep('engagements_list')}
            onEdit={() => setCurrentStep('comments')}
          />
        );

      case 'reports':
        return (
          <ReportsDashboard
            user={user}
            engagements={engagements}
            startDate={startDate}
            endDate={endDate}
            onSetDates={(s, e) => {
              setStartDate(s);
              setEndDate(e);
            }}
            onSelectNewEngagement={handleStartLogging}
            onDeleteEngagement={handleDeleteEngagement}
          />
        );

      case 'settings':
        return (
          <SettingsScreen
            user={user}
            engagements={engagements}
            onSaveProfile={(p) => setUser(p)}
            onResetSampleData={handleResetSampleData}
            onClearAllData={handleClearAllData}
            onImportData={handleImportData}
            onLogout={handleLogout}
          />
        );

      case 'admin':
        return <AdminScreen users={adminUsers} engagements={engagements} reports={reports} onLogout={() => setCurrentStep('home')} />;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen pb-20 sm:pb-24 relative overflow-x-hidden">
      {/* Application Watermark with exactly 5% Opacity */}
      <div
        id="app-global-watermark"
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center overflow-hidden select-none"
      >
        <img
          src="/Logo+lookaway.png"
          alt=""
          className="w-[min(85vw,650px)] max-h-[75vh] object-contain pointer-events-none"
          style={{ opacity: 0.05 }}
        />
      </div>

      {/* Auth Modal Popup: Opens on start with App Logo, GET STARTED, and under it LOG IN & SIGN UP */}
      <AuthModal
        isOpen={isAuthModalOpen}
        currentUser={user}
        initialView={authModalInitialView}
        onClose={() => setIsAuthModalOpen(false)}
        onLogin={handleLogin}
        onSignUp={handleSignUp}
      />

      {/* Shared app surface for web, Android, and iOS */}
      <div className="relative z-10 w-full max-w-[1240px] mx-auto px-2 sm:px-4 py-1 transition-all duration-300">
        <Header
          user={user}
          currentStep={currentStep}
          viewMode="web"
          onSetViewMode={() => undefined}
          onNavigate={(step) => setCurrentStep(step)}
          streakDays={7}
          isAuthenticated={isAuthenticated}
          onOpenAuthModal={() => {
            setAuthModalInitialView('welcome');
            setIsAuthModalOpen(true);
          }}
          onLogout={handleLogout}
          onOpenAdmin={() => setCurrentStep('admin')}
        />

        <main className="native-app-content relative w-full overflow-hidden">
          <img
            src="/Logo+lookaway.png"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 m-auto w-[min(75vw,560px)] max-h-[75vh] object-contain pointer-events-none"
            style={{ opacity: 0.05 }}
          />
          <div className="relative z-10">{renderScreen()}</div>
        </main>

        {/* Footer Note */}
        <div className="text-center text-[#777e80] text-xs font-semibold mt-1 mb-2 select-none">
          Look Away demo • Data is stored in this browser using localStorage.
        </div>
      </div>

      {/* Fixed Bottom Navigation Bar */}
      <BottomNavBar
        currentStep={currentStep}
        onNavigate={(step) => setCurrentStep(step)}
        onOpenAdmin={() => setCurrentStep('admin')}
      />
    </div>
  );
}
