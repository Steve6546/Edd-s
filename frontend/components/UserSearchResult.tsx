interface UserSearchResultProps {
  user: {
    id: string;
    username: string;
    displayName: string;
    profilePictureUrl?: string;
  };
  onClick: () => void;
}

export default function UserSearchResult({ user, onClick }: UserSearchResultProps) {
  const getAvatar = () => {
    if (user.profilePictureUrl) {
      return (
        <img
          src={user.profilePictureUrl}
          alt={user.displayName}
          className="w-10 h-10 rounded-full object-cover"
        />
      );
    }

    const initial = user.displayName.charAt(0).toUpperCase();
    return (
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-400 flex items-center justify-center text-white font-semibold text-sm">
        {initial}
      </div>
    );
  };

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors"
    >
      {getAvatar()}
      <div className="flex-1">
        <p className="font-medium">{user.displayName}</p>
        <p className="text-sm text-muted-foreground">@{user.username}</p>
      </div>
    </div>
  );
}
