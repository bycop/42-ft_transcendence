export enum MatchmakingStatus
{
    Unknown,
    Searching,
    Found
}

export class MatchmakingResponse
{
    public Status : MatchmakingStatus = MatchmakingStatus.Unknown;
    public ServerPort : number;
}
