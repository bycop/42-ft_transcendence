import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthService } from "auth/auth.service";

@Injectable()
export class AuthGuard implements CanActivate {
	public constructor(private authService: AuthService, private readonly reflector: Reflector) {
	}
	async canActivate(
		context: ExecutionContext,
	): Promise<boolean> {
		const isPublic = this.reflector.get<boolean>("isPublic", context.getHandler());
		if (isPublic)
			return true;
		const req = context.switchToHttp().getRequest();
		return this.authService.isConnected(req);
	}
}