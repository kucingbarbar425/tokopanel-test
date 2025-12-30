import { pterodactylConfig } from "@/data/config"

interface UserAttributes {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
}

interface ServerAttributes {
  id: number
  name: string
  user: number
}

interface EggAttributes {
  startup: string
  docker_images: {
    [key: string]: string
  }
}

interface UserResponse {
  attributes?: UserAttributes
  errors?: Array<{ detail: string }>
}

interface ServerResponse {
  attributes?: ServerAttributes
  errors?: Array<{ detail: string }>
}

interface EggResponse {
  attributes?: EggAttributes
  errors?: Array<{ detail: string }>
}

interface ServerListResponse {
  data?: Array<{ attributes: ServerAttributes }>
}

interface UserListResponse {
  data?: Array<{ attributes: UserAttributes }>
}

export class Pterodactyl {
  private domain: string
  private apiKey: string
  private nests: string
  private nestsGame: string
  private egg: string
  private eggSamp: string
  private location: string

  constructor() {
    this.domain = pterodactylConfig.domain
    this.apiKey = pterodactylConfig.apiKey
    this.nests = pterodactylConfig.nests
    this.nestsGame = pterodactylConfig.nestsGame
    this.egg = pterodactylConfig.egg
    this.eggSamp = pterodactylConfig.eggSamp
    this.location = pterodactylConfig.location
  }

  async request<T>(endpoint: string, method = "GET", body: any = null): Promise<T> {
    const options: RequestInit = {
      method,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
    }

    if (body) options.body = JSON.stringify(body)

    const response = await fetch(`${this.domain}/api/application${endpoint}`, options)

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(
        errorData.errors?.[0]?.detail || `API request failed with status ${response.status}: ${response.statusText}`,
      )
    }

    return (await response.json()) as T
  }

  async createUser(username: string, email: string, password: string): Promise<UserResponse> {
    return this.request<UserResponse>("/users", "POST", {
      username: username,
      email: email,
      first_name: username,
      last_name: "User",
      password: password,
    })
  }

async addServer(
  userId: number,
  serverName: username,
  memory: number,
  disk: number,
  cpu: number
): Promise<ServerResponse> {
  const eggData = await this.request<EggResponse>(`/nests/${this.nests}/eggs/${this.egg}`)

  if (!eggData.attributes || !eggData.attributes.startup) {
    throw new Error("Egg startup command is undefined.")
  }

  const dockerImage = eggData.attributes.docker_images["ghcr.io/parkervcp/yolks:nodejs_20"]
  if (!dockerImage) {
    throw new Error("NodeJS 20 docker image not available in this egg.")
  }

  return this.request<ServerResponse>("/servers", "POST", {
    name: serverName,
    description: "Order Panel? Kunjungi (https://panelshopv3.mts4you.biz.id)",
    user: userId,
    egg: Number.parseInt(this.egg),
    docker_image: dockerImage,
    startup: eggData.attributes.startup,
    environment: {
      GIT_ADDRESS: "",
      BRANCH: "",
      USERNAME: "",
      ACCESS_TOKEN: "",
      CMD_RUN: "npm start",
      AUTO_UPDATE: "0",
      NODE_PACKAGES: "",
      UNNODE_PACKAGES: "",
      CUSTOM_ENVIRONMENT_VARIABLES: "",
      USER_UPLOAD: "true"
    },
    limits: {
      memory,
      swap: 0,
      disk,
      io: 500,
      cpu
    },
    feature_limits: {
      databases: 5,
      backups: 5,
      allocations: 1
    },
    deploy: {
      locations: [Number.parseInt(this.location)],
      dedicated_ip: false,
      port_range: []
    }
  })
}

  async listServers(): Promise<Array<{ id: number; name: string; user: number }>> {
    const serversResponse = await this.request<ServerListResponse>("/servers")

    if (!serversResponse.data) {
      return []
    }

    return serversResponse.data.map((server) => ({
      id: server.attributes.id,
      name: server.attributes.name,
      user: server.attributes.user,
    }))
  }

  async listUsers(): Promise<Array<{ id: number; username: string; email: string }>> {
    try {
      const usersResponse = await this.request<UserListResponse>("/users")

      if (!usersResponse.data) {
        return []
      }

      return usersResponse.data.map((user) => ({
        id: user.attributes.id,
        username: user.attributes.username,
        email: user.attributes.email,
      }))
    } catch (error) {
      console.error("Error listing users:", error)
      throw new Error("Failed to retrieve user list from Pterodactyl panel")
    }
  }

  async userInfo(userId: number): Promise<
    | {
        id: number
        username: string
        email: string
        total_servers: number
        servers: Array<{ id: number; name: string; user: number }>
      }
    | { error: string }
  > {
    const userResponse = await this.request<UserResponse>(`/users/${userId}`)

    if (!userResponse.attributes) {
      return { error: "User not found" }
    }

    const servers = await this.listServers()
    const userServers = servers.filter((server) => server.user === userId)

    return {
      id: userResponse.attributes.id,
      username: userResponse.attributes.username,
      email: userResponse.attributes.email,
      total_servers: userServers.length,
      servers: userServers,
    }
  }

  async deleteServer(serverId: number): Promise<any> {
    return this.request(`/servers/${serverId}`, "DELETE")
  }

  async deleteUser(userId: number): Promise<any> {
    return this.request(`/users/${userId}`, "DELETE")
  }
}
